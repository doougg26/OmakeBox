import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../../components/Icon';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import styles from './AuthPage.module.scss';

export default function RegisterPage() {
  useDocumentTitle('Cadastro');
  const [form, setForm] = useState({ nickname: '', email: '', senha: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await register(form.nickname, form.email, form.senha);
      navigate('/discovery');
    } catch (err) {
      const details = err.response?.data?.details;
      if (details && details.length > 0) {
        setError(details.map((d) => d.message).join(', '));
      } else {
        setError(err.response?.data?.error || 'Erro ao cadastrar');
      }
    }
  }

  return (
    <div className={styles['auth-page']}>
      <button
        className={styles['auth-themeBtn']}
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
      </button>
      <div className={styles['auth-card']}>
        <h1 className={styles['auth-title']}>
          Omake<span>Box</span>
        </h1>
        <p className={styles['auth-subtitle']}>Crie sua conta</p>

        {error && <div className={styles['auth-error']}>{error}</div>}

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['auth-field']}>
            <label className="label" htmlFor="nickname">Nickname</label>
            <input
              id="nickname"
              className="input"
              name="nickname"
              type="text"
              placeholder="Seu nickname único"
              value={form.nickname}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={30}
            />
          </div>

          <div className={styles['auth-field']}>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles['auth-field']}>
            <label className="label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              className="input"
              name="senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.senha}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Criar Conta
          </button>
        </form>

        <div className={styles['auth-footer']}>
          Já tem conta? <Link to="/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
