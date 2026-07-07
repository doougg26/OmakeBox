import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { animeApi, onboardingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import ImageWithFallback from '../../components/ImageWithFallback';

import styles from './OnboardingPage.module.scss';

export default function OnboardingPage() {
  useDocumentTitle('Configurar Perfil');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: anime, 2: done
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Redireciona se já configurou
  useEffect(() => {
    if (user?.anime_favorito_id) {
      navigate('/discovery', { replace: true });
    }
  }, [user, navigate]);

  // Busca animes
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['anime-search', debouncedSearch],
    queryFn: async () => {
      const { data } = await animeApi.search(debouncedSearch);
      return data.data || [];
    },
    enabled: debouncedSearch.length > 0,
  });

  // Define anime favorito
  const setAnimeMutation = useMutation({
    mutationFn: async (malId) => {
      const { data } = await onboardingApi.setFavoriteAnime(malId);
      return data;
    },
    onSuccess: () => {
      setStep(2);
    },
  });

  function handleSelectAnime(anime) {
    setSelectedAnime(anime);
  }

  function handleConfirmAnime() {
    if (selectedAnime) {
      setAnimeMutation.mutate(selectedAnime.mal_id);
    }
  }

  function handleFinish() {
    window.location.reload();
  }

  return (
    <div className={styles.onboarding}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          Omake<span>Box</span>
        </h1>

        {step === 1 && (
          <>
            <p className={styles.step}>Passo 1 de 1</p>
            <p className={styles.subtitle}>
              Escolha seu anime favorito para começar
            </p>
            <p className={styles.subtitle} style={{ marginTop: 0, fontSize: '0.75rem' }}>
              Você poderá customizar seu avatar depois nas configurações do perfil.
            </p>

            <div className={styles.searchBox}>
              <input
                className="input"
                type="text"
                placeholder="Buscar anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {searchLoading && <div className="loading"><div className="spinner" /></div>}

            {searchResults && (
              <div className={styles.animeList}>
                {searchResults.map((anime) => (
                  <div
                    key={anime.mal_id}
                    className={`${styles.animeOption} ${
                      selectedAnime?.mal_id === anime.mal_id
                        ? styles['animeOption--selected']
                        : ''
                    }`}
                    onClick={() => handleSelectAnime(anime)}
                  >
                    <ImageWithFallback
                      src={anime.images?.jpg?.image_url || ''}
                      alt={anime.title}
                    />
                    <div className={styles['animeOption__info']}>
                      <div className={styles['animeOption__title']}>
                        {anime.title}
                      </div>
                      <div className={styles['animeOption__meta']}>
                        {anime.type} • {anime.episodes || '?'} eps
                        {anime.score && ` • ★ ${anime.score}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.finishBtn}
                disabled={!selectedAnime || setAnimeMutation.isPending}
                onClick={handleConfirmAnime}
              >
                {setAnimeMutation.isPending ? 'Salvando...' : 'Confirmar Anime Favorito'}
              </button>
              <button className={styles.skipBtn} onClick={() => navigate('/discovery')}>
                Pular por enquanto
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className={styles.step}>Pronto!</p>
            <p className={styles.subtitle}>
              Seu anime favorito foi configurado!
            </p>
            <p className={styles.subtitle} style={{ marginTop: 0, fontSize: '0.75rem' }}>
              Você pode editar seu perfil e adicionar um avatar personalizado depois.
            </p>

            {selectedAnime && (
              <div className={styles.avatarPreview}>
                <ImageWithFallback
                  src={selectedAnime.images?.jpg?.image_url || ''}
                  alt={selectedAnime.title}
                />
                <span>{selectedAnime.title}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.finishBtn} onClick={handleFinish}>
                Começar a Explorar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
