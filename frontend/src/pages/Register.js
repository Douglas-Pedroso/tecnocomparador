import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaFacebook, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Login.css';

function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    // Validações
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({ nome, email, senha });
      login(response.data.token, response.data.usuario);
      navigate('/');
    } catch (error) {
      console.error('Erro no registro:', error);
      setErro(error.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    if (provider === 'google') {
      window.location.href = authAPI.googleLogin();
    } else if (provider === 'facebook') {
      window.location.href = authAPI.facebookLogin();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Criar Conta</h1>
          <p className="auth-subtitle">Comece a comparar preços agora!</p>

          {erro && (
            <div className="alert alert-error">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="nome">
                <FaUser />
                Nome completo
              </label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha">
                <FaLock />
                Senha
              </label>
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmarSenha">
                <FaLock />
                Confirmar senha
              </label>
              <input
                type="password"
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          <div className="divider">
            <span>ou continue com</span>
          </div>

          <div className="oauth-buttons">
            <button 
              onClick={() => handleOAuthLogin('google')}
              className="btn-oauth btn-google"
              disabled={loading}
            >
              <FaGoogle />
              <span>Google</span>
            </button>
            <button 
              onClick={() => handleOAuthLogin('facebook')}
              className="btn-oauth btn-facebook"
              disabled={loading}
            >
              <FaFacebook />
              <span>Facebook</span>
            </button>
          </div>

          <p className="auth-footer">
            Já tem uma conta?{' '}
            <Link to="/login" className="auth-link">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
