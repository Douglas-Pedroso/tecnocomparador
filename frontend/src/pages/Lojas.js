import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaStore, FaSearch, FaSortAmountDown } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import './Lojas.css';

function Lojas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lojas] = useState(location.state?.lojas || []);
  const [resultados] = useState(location.state?.resultados || {});
  const [termo] = useState(location.state?.termo || '');
  const [lojaSelecionada, setLojaSelecionada] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [ordenacao, setOrdenacao] = useState('preco-asc');

  const selecionarLoja = (lojaId) => {
    setLojaSelecionada(lojaId);
    const produtosLoja = resultados[lojaId]?.produtos || [];
    setProdutos(ordenarProdutos(produtosLoja, ordenacao));
  };

  const ordenarProdutos = (produtosArray, tipo) => {
    const copia = [...produtosArray];
    
    switch (tipo) {
      case 'preco-asc':
        return copia.sort((a, b) => a.preco - b.preco);
      case 'preco-desc':
        return copia.sort((a, b) => b.preco - a.preco);
      case 'nome-asc':
        return copia.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'nome-desc':
        return copia.sort((a, b) => b.nome.localeCompare(a.nome));
      default:
        return copia;
    }
  };

  const handleOrdenacao = (tipo) => {
    setOrdenacao(tipo);
    setProdutos(ordenarProdutos(produtos, tipo));
  };

  const voltar = () => {
    setLojaSelecionada(null);
    setProdutos([]);
  };

  if (!lojaSelecionada) {
    return (
      <div className="lojas-page">
        <div className="container">
          <div className="lojas-header">
            <button className="btn-voltar" onClick={() => navigate('/')}>
              ← Nova Pesquisa
            </button>
            <h1>Resultados para "{termo}"</h1>
            <p className="subtitle">
              ✅ Pesquisámos em {lojas.length} {lojas.length === 1 ? 'loja' : 'lojas'} e encontrámos as melhores ofertas<br/>
              <small style={{color: '#fbbf24', fontWeight: '500'}}>Clique numa loja para ver todos os produtos e comparar preços</small>
            </p>
          </div>

          <div className="lojas-grid">
            {lojas.map((loja) => (
              <div 
                key={loja.id} 
                className="loja-card"
                onClick={() => selecionarLoja(loja.id)}
              >
                <div className="loja-icon">
                  <FaStore size={40} />
                </div>
                <h3>{loja.nome}</h3>
                <p className="quantidade">
                  {loja.quantidade} {loja.quantidade === 1 ? 'produto' : 'produtos'}
                </p>
                <button className="btn-ver-produtos">Ver Produtos</button>
              </div>
            ))}
          </div>

          {lojas.length === 0 && (
            <div className="no-results">
              <FaSearch size={60} />
              <p>Nenhuma loja encontrou produtos para "{termo}"</p>
              <button className="btn-primary" onClick={() => navigate('/')}>
                Fazer Nova Busca
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de produtos da loja selecionada
  const lojaNome = resultados[lojaSelecionada]?.loja || '';

  return (
    <div className="produtos-loja-page">
      <div className="container">
        <div className="produtos-header">
          <button className="btn-voltar" onClick={voltar}>
            ← Voltar às Lojas
          </button>
          <h1>{lojaNome}</h1>
          <p className="subtitle">{produtos.length} produtos encontrados</p>
        </div>

        <div className="ordenacao-bar">
          <FaSortAmountDown />
          <span>Ordenar por:</span>
          <select 
            value={ordenacao} 
            onChange={(e) => handleOrdenacao(e.target.value)}
            className="select-ordenacao"
          >
            <option value="preco-asc">Menor Preço</option>
            <option value="preco-desc">Maior Preço</option>
            <option value="nome-asc">Nome (A-Z)</option>
            <option value="nome-desc">Nome (Z-A)</option>
          </select>
        </div>

        <div className="produtos-grid">
          {produtos.map((produto, index) => (
            <ProductCard 
              key={index} 
              produto={produto}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Lojas;
