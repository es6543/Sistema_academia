const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do pool de conexões do Postgres
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistema_academia',
  password: 'ellen8907',
  port: 5432,
  idleTimeoutMillis: 30000, // Fecha conexões inativas após 30 segundos
  max: 10 // Limite máximo de conexões simultâneas no pool
});

// Captura erros em conexões ociosas para evitar a queda espontânea do processo
pool.on('error', (err) => {
  console.error('[-] Erro inesperado em cliente ocioso do Postgres:', err.message);
});

// Teste de conexão seguro usando pool.query (não bloqueia o cliente)
pool.query('SELECT NOW()')
  .then(() => console.log('[+] Conexão com o PostgreSQL estabelecida com sucesso!'))
  .catch((err) => console.error('[-] Falha crítica ao conectar no PostgreSQL:', err.message));

// --- ROTAS DA API ---

// Alunos CRUD - Listar
app.get('/api/alunos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alunos ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Alunos CRUD - Criar
app.post('/api/alunos', async (req, res) => {
  const { nome, email, telefone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO alunos (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *',
      [nome, email, telefone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Alunos CRUD - Deletar
app.delete('/api/alunos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM alunos WHERE id = $1', [req.params.id]);
    res.json({ message: 'Aluno removido com sucesso.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Planos CRUD - Listar
app.get('/api/planos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM planos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Planos CRUD - Criar
app.post('/api/planos', async (req, res) => {
  const { nome, duracao_meses, preco } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO planos (nome, duracao_meses, preco) VALUES ($1, $2, $3) RETURNING *',
      [nome, duracao_meses, preco]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Matrículas - Chamada da PROCEDURE do banco
app.post('/api/matriculas', async (req, res) => {
  const { aluno_id, plano_id, data_inicio } = req.body;
  try {
    await pool.query('CALL registrar_matricula($1, $2, $3)', [aluno_id, plano_id, data_inicio]);
    res.status(201).json({ success: true, message: 'Matrícula efetuada via Procedure!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pagamentos - Listar (Corrigido o traço "-" inválido após o DESC)
app.get('/api/pagamentos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pag.*, al.nome as aluno_nome FROM pagamentos pag
      JOIN matriculas mat ON pag.matricula_id = mat.id
      JOIN alunos al ON mat.aluno_id = al.id
      ORDER BY pag.id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pagamentos - Modificar Status (Ativa o TRIGGER no banco)
app.put('/api/pagamentos/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query('UPDATE pagamentos SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    res.json({ message: 'Status atualizado. O TRIGGER agiu na tabela de alunos!', dados: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3001, () => console.log('[Backend] Servidor ativo na porta 3001'));
