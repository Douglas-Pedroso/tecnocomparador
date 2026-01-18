-- =====================================================
-- POLÍTICAS DE SEGURANÇA RLS (Row Level Security)
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- HABILITAR RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_pesquisas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA: usuarios
-- =====================================================

-- Usuários podem ler apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados"
ON usuarios
FOR SELECT
USING (auth.uid()::text = id::text OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON usuarios
FOR UPDATE
USING (auth.uid()::text = id::text OR email = current_setting('request.jwt.claims', true)::json->>'email');

-- Permitir inserção de novos usuários (registro)
CREATE POLICY "Permitir registro de novos usuários"
ON usuarios
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- POLÍTICAS PARA TABELA: produtos
-- =====================================================

-- Todos podem ler produtos (cache público)
CREATE POLICY "Todos podem ver produtos"
ON produtos
FOR SELECT
TO public
USING (true);

-- Apenas backend pode inserir/atualizar produtos
-- (use uma service role key no backend)
CREATE POLICY "Backend pode inserir produtos"
ON produtos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Backend pode atualizar produtos"
ON produtos
FOR UPDATE
TO authenticated
USING (true);

-- =====================================================
-- POLÍTICAS PARA TABELA: favoritos
-- =====================================================

-- Usuários podem ver apenas seus próprios favoritos
CREATE POLICY "Usuários podem ver seus favoritos"
ON favoritos
FOR SELECT
USING (usuario_id = current_setting('app.current_user_id', true)::int);

-- Usuários podem adicionar favoritos para si mesmos
CREATE POLICY "Usuários podem adicionar favoritos"
ON favoritos
FOR INSERT
WITH CHECK (usuario_id = current_setting('app.current_user_id', true)::int);

-- Usuários podem deletar seus próprios favoritos
CREATE POLICY "Usuários podem deletar seus favoritos"
ON favoritos
FOR DELETE
USING (usuario_id = current_setting('app.current_user_id', true)::int);

-- =====================================================
-- POLÍTICAS PARA TABELA: historico_pesquisas
-- =====================================================

-- Usuários podem ver apenas seu próprio histórico
CREATE POLICY "Usuários podem ver seu histório"
ON historico_pesquisas
FOR SELECT
USING (usuario_id = current_setting('app.current_user_id', true)::int);

-- Usuários podem adicionar ao seu histórico
CREATE POLICY "Usuários podem adicionar ao histórico"
ON historico_pesquisas
FOR INSERT
WITH CHECK (usuario_id = current_setting('app.current_user_id', true)::int);

-- Usuários podem deletar seu próprio histórico
CREATE POLICY "Usuários podem deletar seu histórico"
ON historico_pesquisas
FOR DELETE
USING (usuario_id = current_setting('app.current_user_id', true)::int);

-- =====================================================
-- CONFIGURAÇÕES ADICIONAIS
-- =====================================================

-- Criar função para definir o usuário atual no contexto
CREATE OR REPLACE FUNCTION set_current_user_id(user_id INT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTA: No seu backend, antes de fazer queries relacionadas ao usuário,
-- você deve chamar: SELECT set_current_user_id(<id_do_usuario_logado>);
