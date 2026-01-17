-- Criar banco de dados
-- CREATE DATABASE comparador;

-- Conectar ao banco
-- \c comparador;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT,
    oauth_provider TEXT,
    oauth_id TEXT,
    avatar TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_oauth ON usuarios(oauth_provider, oauth_id);

-- Tabela de produtos (cache de pesquisas)
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    produto_id_externo TEXT NOT NULL,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    preco NUMERIC(10, 2),
    preco_original NUMERIC(10, 2),
    loja TEXT NOT NULL,
    imagem TEXT,
    condicao TEXT,
    disponibilidade TEXT,
    vendedor TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_produtos_externo ON produtos(produto_id_externo);
CREATE INDEX IF NOT EXISTS idx_produtos_loja ON produtos(loja);

-- Tabela de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, produto_id)
);

CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_id);

-- Tabela de histórico de pesquisas
CREATE TABLE IF NOT EXISTS historico_pesquisas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    termo_busca TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historico_usuario ON historico_pesquisas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_pesquisas(criado_em DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamp
CREATE TRIGGER trigger_usuarios_timestamp
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_produtos_timestamp
    BEFORE UPDATE ON produtos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();
