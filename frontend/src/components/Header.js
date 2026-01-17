import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <FaShoppingCart />
          <span>Tecnocomparador</span>
        </Link>

        <nav className="nav">
          {user ? (
            <>
              <Link to="/favoritos" className="nav-link">
                <FaHeart />
                <span>Favoritos</span>
              </Link>
              <div className="user-menu">
                <button className="user-button">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.nome} className="user-avatar" />
                  ) : (
                    <FaUser />
                  )}
                  <span>{user.nome}</span>
                </button>
                <button onClick={handleLogout} className="logout-button">
                  <FaSignOutAlt />
                  <span>Sair</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Entrar
              </Link>
              <Link to="/register" className="nav-link btn-register">
                Criar Conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
