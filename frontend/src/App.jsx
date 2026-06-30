import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [alunos, setAlunos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);

  const [novoAluno, setNovoAluno] = useState({ nome: '', email: '', telefone: '' });
  const [novoPlano, setNovoPlano] = useState({ nome: '', duracao_meses: '', preco: '' });
  const [novaMatricula, setNovaMatricula] = useState({ aluno_id: '', plano_id: '', data_inicio: '' });

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    try {
      const rAlunos = await axios.get(`${API_URL}/alunos`);
      const rPlanos = await axios.get(`${API_URL}/planos`);
      const rPagamentos = await axios.get(`${API_URL}/pagamentos`);
      setAlunos(rAlunos.data); setPlanos(rPlanos.data); setPagamentos(rPagamentos.data);
    } catch (err) { console.error("Erro ao conectar com a API Backend", err); }
  };

  const handleCriarAluno = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/alunos`, novoAluno);
    setNovoAluno({ nome: '', email: '', telefone: '' });
    carregarDados();
  };

  const handleCriarPlano = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/planos`, novoPlano);
    setNovoPlano({ nome: '', duracao_meses: '', preco: '' });
    carregarDados();
  };

  const handleDeletarAluno = async (id) => {
    if (confirm("Remover este aluno do sistema?")) {
      await axios.delete(`${API_URL}/alunos/${id}`);
      carregarDados();
    }
  };

  const handleProcedureMatricula = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/matriculas`, novaMatricula);
      alert('Sucesso: PROCEDURE executada no PostgreSQL!');
      setNovaMatricula({ aluno_id: '', plano_id: '', data_inicio: '' });
      carregarDados();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro executando procedure.');
    }
  };

  const handleForcarTriggerVencimento = async (id) => {
    try {
      const res = await axios.put(`${API_URL}/pagamentos/${id}/status`, { status: 'VENCIDO' });
      alert(res.data.message);
      carregarDados();
    } catch (err) { alert('Erro no disparo do gatilho.'); }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ background: '#1e3a8a', color: 'white', padding: '15px', borderRadius: '6px', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>🏋️ Painel Academia - Banco de Dados II</h2>
      </header>

      {/* Seção de Formulários */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
          <h3>Cadastrar Aluno (CRUD - Create)</h3>
          <form onSubmit={handleCriarAluno}>
            <input placeholder="Nome" required value={novoAluno.nome} onChange={e => setNovoAluno({...novoAluno, nome: e.target.value})} style={{display:'block', width:'95%', margin:'8px 0', padding:'8px'}}/>
            <input type="email" placeholder="Email" required value={novoAluno.email} onChange={e => setNovoAluno({...novoAluno, email: e.target.value})} style={{display:'block', width:'95%', margin:'8px 0', padding:'8px'}}/>
            <input placeholder="Telefone" value={novoAluno.telefone} onChange={e => setNovoAluno({...novoAluno, telefone: e.target.value})} style={{display:'block', width:'95%', margin:'8px 0', padding:'8px'}}/>
            <button type="submit" style={{padding:'10px', background:'#10b981', color:'white', border:'none', width:'100%', cursor:'pointer', fontWeight:'bold'}}>Salvar Aluno</button>
          </form>
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
          <h3>Cadastrar Plano (CRUD - Create)</h3>
          <form onSubmit={handleCriarPlano}>
            <input placeholder="Nome do Plano" required value={novoPlano.nome} onChange={e => setNovoPlano({...novoPlano, nome: e.target.value})} style={{display:'block', width:'95%', margin:'8px 0', padding:'8px'}}/>
            <input type="number" placeholder="Duração em Meses" required value={novoPlano.duracao_meses} onChange={e => setNovoPlano({...novoPlano, duracao_meses: e.target.value})} style={{display:'block', width:'95%', margin:'8px 0', padding:'8px'}}/>
            <input type="number" step="0.01" placeholder="Preço Total" required value={novoPlano.preco} onChange={e => setNovoPlano({...novoPlano, preco: e.target.value})} style={{display:'block', width:'95%', margin:'8px 0', padding:'8px'}}/>
            <button type="submit" style={{padding:'10px', background:'#10b981', color:'white', border:'none', width:'100%', cursor:'pointer', fontWeight:'bold'}}>Salvar Plano</button>
          </form>
        </div>
      </div>

      {/* Acionador de Procedure */}
      <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '6px', marginBottom: '35px', borderLeft: '6px solid #3b82f6' }}>
        <h3 style={{ marginTop: 0, color: '#1e40af' }}>🚀 Registrar Matrícula via <code style={{color: '#ef4444'}}>PROCEDURE</code></h3>
        <form onSubmit={handleProcedureMatricula} style={{ display: 'flex', gap: '15px' }}>
          <select required value={novaMatricula.aluno_id} onChange={e => setNovaMatricula({...novaMatricula, aluno_id: e.target.value})} style={{padding:'10px'}}>
            <option value="">Selecione o Aluno</option>
            {alunos.map(a => <option key={a.id} value={a.id}>{a.nome} ({a.status})</option>)}
          </select>
          <select required value={novaMatricula.plano_id} onChange={e => setNovaMatricula({...novaMatricula, plano_id: e.target.value})} style={{padding:'10px'}}>
            <option value="">Selecione o Plano</option>
            {planos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <input type="date" required value={novaMatricula.data_inicio} onChange={e => setNovaMatricula({...novaMatricula, data_inicio: e.target.value})} style={{padding:'8px'}} />
          <button type="submit" style={{padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', fontWeight:'bold', cursor:'pointer'}}>Executar CALL</button>
        </form>
      </div>

      {/* Visualização dos Alunos */}
      <h3>Alunos Cadastrados (CRUD - Read / Delete)</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '35px', backgroundColor: 'white' }}>
        <thead><tr style={{ background: '#f1f5f9' }}><th>ID</th><th>Nome</th><th>Email</th><th>Status Atual</th><th>Ações</th></tr></thead>
        <tbody>
          {alunos.map(a => (
            <tr key={a.id}>
              <td>{a.id}</td><td>{a.nome}</td><td>{a.email}</td>
              <td style={{ fontWeight: 'bold', color: a.status === 'ATIVO' ? 'green' : 'red' }}>{a.status}</td>
              <td><button onClick={() => handleDeletarAluno(a.id)} style={{color:'red', cursor:'pointer', border:'none', background:'none', textDecoration:'underline'}}>Remover</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Monitor de Pagamento e Trigger */}
      <h3>Controle Financeiro (Validação do <code style={{color: '#ef4444'}}>TRIGGER</code>)</h3>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead><tr style={{ background: '#f1f5f9' }}><th>ID Fatura</th><th>Aluno</th><th>Valor</th><th>Vencimento</th><th>Estado</th><th>Gatilho Técnico</th></tr></thead>
        <tbody>
          {pagamentos.map(pag => (
            <tr key={pag.id}>
              <td>{pag.id}</td><td>{pag.aluno_nome}</td><td>R$ {parseFloat(pag.valor).toFixed(2)}</td><td>{new Date(pag.data_vencimento).toLocaleDateString('pt-BR')}</td>
              <td style={{ fontWeight: 'bold', color: pag.status === 'VENCIDO' ? 'red' : 'orange' }}>{pag.status}</td>
              <td>
                {pag.status === 'PENDENTE' && (
                  <button onClick={() => handleForcarTriggerVencimento(pag.id)} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Simular Vencimento 💥</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;