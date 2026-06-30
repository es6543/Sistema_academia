-- Reinicialização limpa do ambiente de testes
DROP TRIGGER IF EXISTS trg_atualizar_status_vencido ON pagamentos;
DROP FUNCTION IF EXISTS fn_atualizar_status_por_vencimento();
DROP PROCEDURE IF EXISTS registrar_matricula(INT, INT, DATE);
DROP FUNCTION IF EXISTS calcular_vencimento_plano(data_inicio DATE, meses INT);
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS matriculas CASCADE;
DROP TABLE IF EXISTS planos CASCADE;
DROP TABLE IF EXISTS alunos CASCADE;

-- 1. Tabela de Alunos (CRUD)
CREATE TABLE alunos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ATIVO'
);

-- 2. Tabela de Planos (CRUD)
CREATE TABLE planos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    duracao_meses INT NOT NULL,
    preco DECIMAL(10,2) NOT NULL
);

-- 3. Tabela de Matrículas (Registro de Matrícula)
CREATE TABLE matriculas (
    id SERIAL PRIMARY KEY,
    aluno_id INT REFERENCES alunos(id) ON DELETE CASCADE,
    plano_id INT REFERENCES planos(id) ON DELETE RESTRICT,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ATIVA'
);

-- 4. Tabela de Pagamentos (Controle de Pagamentos)
CREATE TABLE pagamentos (
    id SERIAL PRIMARY KEY,
    matricula_id INT REFERENCES matriculas(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE'
);

-- FUNCTION: Calcular vencimento do plano
CREATE OR REPLACE FUNCTION calcular_vencimento_plano(data_inicio DATE, meses INT)
RETURNS DATE AS $$
BEGIN
    RETURN data_inicio + (meses || ' month')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- PROCEDURE: Registrar Matrícula com transação segura
CREATE OR REPLACE PROCEDURE registrar_matricula(
    p_aluno_id INT,
    p_plano_id INT,
    p_data_inicio DATE
) AS $$
DECLARE
    v_duracao INT;
    v_preco DECIMAL(10,2);
    v_data_fim DATE;
    v_matricula_id INT;
BEGIN
    SELECT duracao_meses, preco INTO v_duracao, v_preco FROM planos WHERE id = p_plano_id;
    
    IF v_duracao IS NULL THEN
        RAISE EXCEPTION 'Plano não encontrado.';
    END IF;

    -- Chamada da FUNCTION interna
    v_data_fim := calcular_vencimento_plano(p_data_inicio, v_duracao);
    
    INSERT INTO matriculas (aluno_id, plano_id, data_inicio, data_fim, status)
    VALUES (p_aluno_id, p_plano_id, p_data_inicio, v_data_fim, 'ATIVA')
    RETURNING id INTO v_matricula_id;
    
    INSERT INTO pagamentos (matricula_id, valor, data_vencimento, status)
    VALUES (v_matricula_id, v_preco, p_data_inicio + INTERVAL '5 days', 'PENDENTE');

    UPDATE alunos SET status = 'ATIVO' WHERE id = p_aluno_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro transacional na matrícula. Rollback aplicado: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER e TRIGGER FUNCTION: Inativa aluno se pagamento vencer
CREATE OR REPLACE FUNCTION fn_atualizar_status_por_vencimento()
RETURNS TRIGGER AS $$
DECLARE
    v_aluno_id INT;
BEGIN
    IF NEW.status = 'VENCIDO' AND OLD.status <> 'VENCIDO' THEN
        SELECT aluno_id INTO v_aluno_id FROM matriculas WHERE id = NEW.matricula_id;
        UPDATE alunos SET status = 'INATIVO' WHERE id = v_aluno_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_status_vencido
AFTER UPDATE ON pagamentos
FOR EACH ROW
EXECUTE FUNCTION fn_atualizar_status_por_vencimento();

-- Dados iniciais para o sistema não iniciar vazio
INSERT INTO planos (nome, duracao_meses, preco) VALUES 
('Plano Mensal', 1, 90.00), 
('Plano Trimestral', 3, 240.00);