import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import './SearchBar.css';

function SearchBar({ onSearch, loading }) {
  const [termo, setTermo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (termo.trim()) {
      onSearch(termo.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <div className="search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Pesquisar produtos (ex: Notebook Gamer, iPhone 13...)"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          disabled={loading}
          className="search-input"
        />
        <button 
          type="submit" 
          disabled={loading || !termo.trim()}
          className="search-button"
        >
          {loading ? 'Pesquisando...' : 'Buscar'}
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
