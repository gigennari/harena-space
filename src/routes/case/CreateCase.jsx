import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateCase.css';

function CreateCase() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    answer: '',
    possible_answers: [''],
    complexity: 'undergraduate',
    specialty: '',
    image: null
  });
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState('draft'); // <-- Definir o estado inicial para 'draft'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const person = JSON.parse(localStorage.getItem('person'));
    if (!person || !token) return;

    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/quests/`, {
      headers: { Authorization: `Token ${token}` }
    }).then(res => {
      const editable = res.data.filter(q =>
        q.owner.id === person.id ||
        (person.groups && person.groups.includes(`authors_${q.id}`)) ||
        (person.groups && person.groups.includes(`editors_${q.id}`))
      );
      setQuests(editable);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const person = JSON.parse(localStorage.getItem('person'));

    // 1. Validação dos campos obrigatórios
    if (!formData.name || !formData.description || !formData.content || !formData.answer || !formData.complexity) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    // A validação do `select` é feita automaticamente pelo atributo `required`.
    // A validação manual não é mais estritamente necessária aqui, mas pode ser útil para mensagens personalizadas.
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      // Anexar apenas se o valor não for nulo para o campo de imagem
      if (key === 'image' && !val) {
        return; // Pula se a imagem for null
      }
      
      // Lidar com 'possible_answers'
      if (key === 'possible_answers') {
        const parsedAnswers = Array.isArray(val)
          ? val.map((s) => s.trim())
          : val.split(',').map((s) => s.trim());
        data.append(key, JSON.stringify(parsedAnswers));
      } else {
        data.append(key, val);
      }
    });

    if (person?.id) {
        data.append('case_owner', person.id);
    }

    // 2. Ajuste na lógica para anexar o quest_id
    if (selectedQuest && selectedQuest !== 'draft') {
      data.append('quest_id', selectedQuest);
    }

    try {
        const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/cases/create/`, data, {
            headers: {
                Authorization: `Token ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        const caseId = res.data.id;
        if (selectedQuest && selectedQuest !== 'draft') {
            // Se uma quest foi selecionada, adiciona o caso a ela
           await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/quests/${selectedQuest}/cases/add/`, { case_id: caseId }, {
                headers: { Authorization: `Token ${token}` }
            });
        }

        alert('Case saved successfully!');
        navigate('/');
    } catch (err) {
        console.error(err);
        alert('Failed to save case');
    }
  };

  return (
    <div className="create-case-container">
      <h2>Create a New Case</h2>
      <form onSubmit={handleSubmit} className="case-form">
        <label htmlFor="name">Case Title *</label>
        <input type="text" id="name" name="name" placeholder="Case Title" value={formData.name} onChange={handleChange} required />
        
        <label htmlFor="description">Description *</label>
        <textarea id="description" name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
        
        <label htmlFor="content">Full Content *</label>
        <textarea id="content" name="content" placeholder="Full Content" value={formData.content} onChange={handleChange} required />
        
        <label htmlFor="answer">Correct Answer *</label>
        <input type="text" id="answer" name="answer" placeholder="Correct Answer" value={formData.answer} onChange={handleChange} required />

        <label>Possible Answers (Optional):</label>
        {formData.possible_answers.map((answer, index) => (
          <div key={index} className="answer-item">
            <input
              type="text"
              value={answer}
              onChange={(e) => {
                const updated = [...formData.possible_answers];
                updated[index] = e.target.value;
                setFormData({ ...formData, possible_answers: updated });
              }}
            />
            <button
              type="button"
              onClick={() => {
                const updated = [...formData.possible_answers];
                updated.splice(index, 1);
                setFormData({ ...formData, possible_answers: updated });
              }}
            >
              🗑️
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setFormData({
              ...formData,
              possible_answers: [...formData.possible_answers, '']
            })
          }
        >
          ➕ Add Answer
        </button>

        <label htmlFor="complexity">Complexity *</label>
        <select id="complexity" name="complexity" value={formData.complexity} onChange={handleChange} required>
          <option value="undergraduate">Undergraduate</option>
          <option value="graduate">Graduate</option>
          <option value="postgraduate">Postgraduate</option>
        </select>

        <label htmlFor="specialty">Specialty (Optional):</label>
        <input type="text" id="specialty" name="specialty" placeholder="Specialty (optional)" value={formData.specialty} onChange={handleChange} />
        
        <label htmlFor="image">Image (Optional):</label>
        <input type="file" id="image" name="image" accept="image/*" onChange={handleChange} />

        <label htmlFor="save-option">Save as Draft / Select Quest *</label>
        {!loading && quests.length > 0 && (
          <select id="save-option" value={selectedQuest} onChange={e => setSelectedQuest(e.target.value)} required>
            <option value="draft">Save as Draft</option> {/* <-- Valor alterado para "draft" */}
            {quests.map(q => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
        )}
        {/* Caso não haja quests para o usuário, a opção de draft é a única */}
        {!loading && quests.length === 0 && (
          <p>You can only save this case as a draft.</p>
        )}

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default CreateCase;