import React, { useState, useContext } from 'react';
import { FaHeart, FaRegHeart, FaExternalLinkAlt, FaStore } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { favoritosAPI } from '../services/api';
import './ProductCard.css';

function ProductCard({ produto, isFavorito = false, onFavoritoChange }) {
  const { user } = useContext(AuthContext);
  const [favorito, setFavorito] = useState(isFavorito);
  const [loading, setLoading] = useState(false);

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(preco);
  };

  const calcularDesconto = () => {
    if (produto.preco_original && produto.preco_original > produto.preco) {
      const desconto = ((produto.preco_original - produto.preco) / produto.preco_original) * 100;
      return Math.round(desconto);
    }
    return 0;
  };

  const handleFavorito = async () => {
    if (!user) {
      alert('Faça login para adicionar favoritos!');
      return;
    }

    const produtoId = produto.id || produto.id_externo;
    if (!produtoId) {
      alert('Produto inválido. Não é possível adicionar aos favoritos.');
      return;
    }

    setLoading(true);
    try {
      if (favorito) {
        await favoritosAPI.removerPorProduto(produtoId);
        setFavorito(false);
      } else {
        // Enviar dados completos do produto
        await favoritosAPI.adicionar(produtoId, produto);
        setFavorito(true);
      }
      if (onFavoritoChange) {
        onFavoritoChange();
      }
    } catch (error) {
      console.error('Erro ao gerenciar favorito:', error);
      alert('Erro ao atualizar favorito. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const desconto = calcularDesconto();

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={produto.imagem} 
          alt={produto.nome}
          className="product-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=Sem+Imagem';
          }}
        />
        {desconto > 0 && (
          <span className="discount-badge">-{desconto}%</span>
        )}
        <button 
          onClick={handleFavorito}
          disabled={loading}
          className="favorite-button"
          title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          {favorito ? <FaHeart className="heart-filled" /> : <FaRegHeart />}
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-title">{produto.nome}</h3>
        
        <div className="product-store">
          <FaStore />
          <span>{produto.loja}</span>
        </div>

        <div className="product-pricing">
          {desconto > 0 && (
            <span className="original-price">
              {formatarPreco(produto.preco_original)}
            </span>
          )}
          <span className="current-price">
            {formatarPreco(produto.preco)}
          </span>
        </div>

        <div className="product-details">
          <span className={`badge ${produto.condicao === 'Novo' ? 'badge-new' : 'badge-used'}`}>
            {produto.condicao}
          </span>
          <span className={`badge ${produto.disponibilidade === 'Disponível' ? 'badge-available' : 'badge-unavailable'}`}>
            {produto.disponibilidade}
          </span>
        </div>

        <a 
          href={produto.url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-button"
        >
          Ver Produto
          <FaExternalLinkAlt />
        </a>
      </div>
    </div>
  );
}

export default ProductCard;
