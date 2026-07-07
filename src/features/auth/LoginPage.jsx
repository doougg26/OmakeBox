import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import styles from './AuthPage.module.scss';

export default function LoginPage() {
  useDocumentTitle('Entrar');
  const [identifier, setIdentifier] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      await login(identifier, senha);
      navigate('/discovery');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    }
  }

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <h1 className={styles['auth-title']}>
          Omake<span>Box</span>
        </h1>
        <p className={styles['auth-subtitle']}>Entre na sua conta</p>

        {error && <div className={styles['auth-error']}>{error}</div>}

        <form className={styles['auth-form']} onSubmit={handleSubmit}>
          <div className={styles['auth-field']}>
            <label className="label" htmlFor="identifier">
              Nickname ou Email
            </label>
            <input
              id="identifier"
              className="input"
              type="text"
              placeholder="Seu nickname ou email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className={styles['auth-field']}>
            <label className="label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              className="input"
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Entrar
          </button>
        </form>

        <div className={styles['auth-footer']}>
          Não tem conta? <Link to="/register">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}
