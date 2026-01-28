import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, senha });
      login(response.data.token, response.data.usuario);
      navigate('/');
    } catch (error) {
      console.error('Erro no login:', error);
      setErro(error.response?.data?.error || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = authAPI.googleLogin();
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Bem-vindo de volta!</h1>
          <p className="auth-subtitle">Entre na sua conta para continuar</p>

          {erro && (
            <div className="alert alert-error">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="divider">
            <span>ou continue com</span>
          </div>

          <div className="oauth-buttons">
            <button 
              onClick={handleOAuthLogin}
              className="btn-oauth btn-google"
              disabled={loading}
            >
              <FaGoogle />
              <span>Google</span>
            </button>
          </div>

          <p className="auth-footer">
            Não tem uma conta?{' '}
            <Link to="/register" className="auth-link">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
