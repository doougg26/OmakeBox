import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { animeApi, onboardingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './OnboardingPage.module.scss';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1); // 1: anime, 2: avatar, 3: done
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Redireciona se já configurou
  useEffect(() => {
    if (user?.anime_favorito_id && user?.avatar_personagem_id) {
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

  // Busca opções de avatar
  const { data: avatarOptions, isLoading: avatarLoading } = useQuery({
    queryKey: ['avatar-options'],
    queryFn: async () => {
      const { data } = await onboardingApi.getAvatarOptions();
      return data;
    },
    enabled: step === 2,
  });

  // Define avatar
  const setAvatarMutation = useMutation({
    mutationFn: async (characterMalId) => {
      const { data } = await onboardingApi.setAvatar(characterMalId);
      return data;
    },
    onSuccess: () => {
      setStep(3);
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

  function handleSelectAvatar(char) {
    setSelectedAvatar(char);
  }

  function handleConfirmAvatar() {
    if (selectedAvatar) {
      setAvatarMutation.mutate(selectedAvatar.mal_id);
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
            <p className={styles.step}>Passo 1 de 2</p>
            <p className={styles.subtitle}>
              Escolha seu anime favorito para começar
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
                    <img
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
            <p className={styles.step}>Passo 2 de 2</p>
            <p className={styles.subtitle}>
              Escolha um personagem como avatar
            </p>

            {selectedAnime && (
              <div className={styles.favoriteDisplay}>
                <img
                  src={selectedAnime.images?.jpg?.image_url || ''}
                  alt={selectedAnime.title}
                />
                <div>
                  <div className={styles['favoriteDisplay__title']}>
                    {selectedAnime.title}
                  </div>
                  <div className={styles['favoriteDisplay__sub']}>
                    Seu anime favorito
                  </div>
                </div>
              </div>
            )}

            {avatarLoading && <div className="loading"><div className="spinner" /></div>}

            {avatarOptions && avatarOptions.length > 0 && (
              <div className={styles.avatarGrid}>
                {avatarOptions.map((char) => (
                  <div
                    key={char.id}
                    className={`${styles.avatarOption} ${
                      selectedAvatar?.mal_id === char.mal_id
                        ? styles['avatarOption--selected']
                        : ''
                    }`}
                    onClick={() => handleSelectAvatar(char)}
                  >
                    <img src={char.imagem_url || ''} alt={char.nome} />
                    <span>{char.nome}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.finishBtn}
                disabled={!selectedAvatar || setAvatarMutation.isPending}
                onClick={handleConfirmAvatar}
              >
                {setAvatarMutation.isPending ? 'Salvando...' : 'Confirmar Avatar'}
              </button>
              <button className={styles.skipBtn} onClick={() => navigate('/discovery')}>
                Pular por enquanto
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className={styles.step}>Pronto!</p>
            <p className={styles.subtitle}>
              Seu perfil foi configurado com sucesso
            </p>

            <div className={styles.avatarPreview}>
              {selectedAvatar && (
                <img src={selectedAvatar.imagem_url || ''} alt={selectedAvatar.nome} />
              )}
              <span>{selectedAvatar?.nome || 'Avatar selecionado'}</span>
            </div>

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
