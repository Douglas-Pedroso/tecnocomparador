import React, { useState, useEffect } from 'react';
import { FaHeart, FaTrash } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import { favoritosAPI } from '../services/api';
import './Favoritos.css';

function Favoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarFavoritos = async () => {
    setLoading(true);
    setErro('');
    
    try {
      const response = await favoritosAPI.listar();
      setFavoritos(response.data.favoritos || []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setErro('Erro ao carregar favoritos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFavoritos();
  }, []);

  const handleRemoverTodos = async () => {
    if (!window.confirm('Tem certeza que deseja remover todos os favoritos?')) {
      return;
    }

    try {
      // Remover todos os favoritos
      await Promise.all(
        favoritos.map(fav => favoritosAPI.remover(fav.favorito_id))
      );
      setFavoritos([]);
    } catch (error) {
      console.error('Erro ao remover favoritos:', error);
      alert('Erro ao remover alguns favoritos. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="favoritos-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favoritos-page">
      <div className="container">
        <div className="favoritos-header">
          <div className="header-title">
            <FaHeart className="heart-icon" />
            <h1>Meus Favoritos</h1>
            <span className="count-badge">{favoritos.length}</span>
          </div>
          
          {favoritos.length > 0 && (
            <button onClick={handleRemoverTodos} className="btn btn-danger">
              <FaTrash />
              <span>Limpar tudo</span>
            </button>
          )}
        </div>

        {erro && (
          <div className="alert alert-error">
            {erro}
          </div>
        )}

        {favoritos.length === 0 ? (
          <div className="empty-state">
            <FaHeart />
            <h2>Nenhum favorito ainda</h2>
            <p>Adicione produtos aos favoritos para vê-los aqui</p>
          </div>
        ) : (
          <div className="products-grid">
            {favoritos.map((fav) => (
              <ProductCard 
                key={fav.id} 
                produto={fav}
                isFavorito={true}
                onFavoritoChange={carregarFavoritos}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favoritos;
