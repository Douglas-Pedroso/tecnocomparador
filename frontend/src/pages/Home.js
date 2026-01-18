import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingBag } from 'react-icons/fa';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { produtosAPI } from '../services/api';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);

  const handleBusca = async (termo) => {
    setLoading(true);
    setErro('');
    setPesquisaRealizada(true);
    
    try {
      // Buscar produtos agrupados por loja
      const response = await produtosAPI.buscarPorLojas(termo);
      
      if (response.data.lojas && response.data.lojas.length > 0) {
        // Navegar para página de lojas
        navigate('/lojas', { 
          state: { 
            lojas: response.data.lojas,
            resultados: response.data.resultados,
            termo 
          } 
        });
      } else {
        setErro('Nenhum produto encontrado nas lojas. Tente outro termo!');
        setProdutos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setErro('Erro ao buscar produtos. Verifique sua conexão e tente novamente.');
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="hero">
        <div className="container">
          <h1 className="hero-title">
            Compare preços de <span className="highlight">tecnologia</span> em <span style={{color: '#ef4444', textShadow: '0 0 2px #22c55e, 0 0 4px #22c55e, -1px -1px 0 #22c55e, 1px -1px 0 #22c55e, -1px 1px 0 #22c55e, 1px 1px 0 #22c55e'}}>Portugal</span>
          </h1>
          <p className="hero-subtitle">
            Pesquise produtos em lojas dentro de Portugal e encontre o melhor preço.<br/>
            <strong>Worten, Radio Popular, PCDiga, PCBem, Chip7 e GlobalData</strong> - Tudo num só lugar!
          </p>
          <SearchBar onSearch={handleBusca} loading={loading} />
          
          {/* Categorias Populares */}
          <div className="categorias-populares">
            <p className="categorias-label">🔥 Categorias Populares:</p>
            <div className="categorias-grid">
              <button className="categoria-chip" onClick={() => handleBusca('portátil')}>💻 Portáteis</button>
              <button className="categoria-chip" onClick={() => handleBusca('smartphone')}>📱 Smartphones</button>
              <button className="categoria-chip" onClick={() => handleBusca('iphone')}>📱 iPhone</button>
              <button className="categoria-chip" onClick={() => handleBusca('samsung')}>📱 Samsung</button>
              <button className="categoria-chip" onClick={() => handleBusca('xiaomi')}>📱 Xiaomi</button>
              <button className="categoria-chip" onClick={() => handleBusca('televisão')}>📺 Televisões</button>
              <button className="categoria-chip" onClick={() => handleBusca('tablet')}>📲 Tablets</button>
              <button className="categoria-chip" onClick={() => handleBusca('smartwatch')}>⌚ Smartwatches</button>
              <button className="categoria-chip" onClick={() => handleBusca('headphones')}>🎧 Headphones</button>
              <button className="categoria-chip" onClick={() => handleBusca('teclado')}>⌨️ Teclados</button>
              <button className="categoria-chip" onClick={() => handleBusca('rato')}>🖱️ Ratos</button>
              <button className="categoria-chip" onClick={() => handleBusca('monitor')}>🖥️ Monitores</button>
              <button className="categoria-chip" onClick={() => handleBusca('impressora')}>🖨️ Impressoras</button>
              <button className="categoria-chip" onClick={() => handleBusca('frigorífico')}>❄️ Frigoríficos</button>
              <button className="categoria-chip" onClick={() => handleBusca('máquina lavar')}>🧺 Máquinas Lavar</button>
              <button className="categoria-chip" onClick={() => handleBusca('aspirador')}>🧹 Aspiradores</button>
              <button className="categoria-chip" onClick={() => handleBusca('câmara')}>📷 Câmaras</button>
              <button className="categoria-chip" onClick={() => handleBusca('consola')}>🎮 Consolas</button>
              <button className="categoria-chip" onClick={() => handleBusca('SSD')}>💾 SSDs</button>
              <button className="categoria-chip" onClick={() => handleBusca('powerbank')}>🔋 Powerbanks</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container results-section">
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>A pesquisar nas 6 lojas... Aguarde cerca de 20 segundos</p>
            <small style={{color: '#fbbf24', marginTop: '10px', fontWeight: '500'}}>Estamos a analisar centenas de produtos para si</small>
          </div>
        )}

        {erro && !loading && (
          <div className="alert alert-error">
            {erro}
            <br/>
            <small>Dica: Tente termos como "notebook", "ryzen", "monitor", "teclado", etc.</small>
          </div>
        )}

        {!loading && !erro && produtos.length > 0 && (
          <>
            <div className="results-header">
              <h2>Encontramos {produtos.length} produtos</h2>
              <div className="filters">
                <span className="filter-label">Ordenar por:</span>
                <select className="filter-select">
                  <option value="preco-asc">Menor preço</option>
                  <option value="preco-desc">Maior preço</option>
                  <option value="nome-asc">Nome (A-Z)</option>
                  <option value="nome-desc">Nome (Z-A)</option>
                </select>
              </div>
            </div>

            <div className="products-grid">
              {produtos.map((produto) => (
                <ProductCard 
                  key={produto.id_externo} 
                  produto={produto}
                />
              ))}
            </div>
          </>
        )}

        {!pesquisaRealizada && !loading && (
          <>
            <div className="empty-state">
              <FaSearch />
              <h2>Comece a economizar agora!</h2>
              <p>Pesquise notebooks, processadores, placas gráficas, periféricos e muito mais</p>
              <small style={{color: '#fbbf24', marginTop: '10px', fontWeight: '500'}}>Ex: "notebook", "ryzen 7", "RTX 4060", "monitor 27"</small>
            </div>
            
            <div className="beneficios-section" style={{marginTop: '50px'}}>
              <h2 style={{textAlign: 'center', marginBottom: '30px'}}>Por que usar o Tecnocomparador?</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '40px'}}>
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '3rem', marginBottom: '10px'}}>💰</div>
                  <h3>Economize Tempo e Dinheiro</h3>
                  <p style={{color: 'rgba(255, 255, 255, 0.85)'}}>Visite 5 lojas em segundos em vez de horas navegando manualmente</p>
                </div>
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '3rem', marginBottom: '10px'}}>🏪</div>
                  <h3>Principais Lojas Portuguesas</h3>
                  <p style={{color: 'rgba(255, 255, 255, 0.85)'}}>Worten, Radio Popular, PCDiga, PCBem, Chip7 e GlobalData com entrega em Portugal</p>
                </div>
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '3rem', marginBottom: '10px'}}>⚡</div>
                  <h3>Resultados em Tempo Real</h3>
                  <p style={{color: 'rgba(255, 255, 255, 0.85)'}}>Preços e disponibilidade atualizados diretamente dos sites das lojas</p>
                </div>
                <div style={{textAlign: 'center', padding: '20px'}}>
                  <div style={{fontSize: '3rem', marginBottom: '10px'}}>📊</div>
                  <h3>Comparação Completa</h3>
                  <p style={{color: 'rgba(255, 255, 255, 0.85)'}}>Veja centenas de produtos lado a lado e escolha a melhor oferta</p>
                </div>
              </div>
            </div>
          </>
        )}

        {pesquisaRealizada && !loading && produtos.length === 0 && !erro && (
          <div className="empty-state">
            <FaShoppingBag />
            <h2>Nenhum produto encontrado</h2>
            <p>Tente pesquisar com outros termos</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
