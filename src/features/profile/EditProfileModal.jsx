import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi, animeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import ImageWithFallback from '../../components/ImageWithFallback';
import styles from './EditProfileModal.module.scss';

export default function EditProfileModal({ profile, queryClient, onClose }) {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const nickname = currentUser?.nickname;
  const fileInputRef = useRef(null);

  // Step control: 0=bio+links, 1=anime+avatar
  const [step, setStep] = useState(0);
  const maxSteps = 2;

  // Step 0: Bio & Links
  const [bio, setBio] = useState(profile?.bio || '');
  const [links, setLinks] = useState(profile?.links_sociais || []);

  // Step 1: Favorite anime
  const [animeSearch, setAnimeSearch] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const debouncedAnimeSearch = useDebounce(animeSearch, 400);

  // Step 1: Avatar (URL or file upload)
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Track what changed
  const [bioChanged, setBioChanged] = useState(false);
  const [linksChanged, setLinksChanged] = useState(false);
  const [animeChanged, setAnimeChanged] = useState(false);
  const [avatarChanged, setAvatarChanged] = useState(false);

  // Save profile mutation (bio + links)
  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result } = await userApi.updateMe(data);
      return result;
    },
  });

  // Save favorite anime mutation
  const saveAnimeMutation = useMutation({
    mutationFn: async (malId) => {
      const { data } = await userApi.updateFavoriteAnime(malId);
      return data;
    },
  });

  // Save avatar URL mutation
  const setAvatarUrlMutation = useMutation({
    mutationFn: async (url) => {
      const { data } = await userApi.setAvatarUrl(url);
      return data;
    },
  });

  // Upload avatar file mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file) => {
      const { data } = await userApi.uploadAvatar(file);
      return data;
    },
  });

  // Remove avatar mutation
  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      const { data } = await userApi.removeAvatar();
      return data;
    },
    onSuccess: () => {
      setAvatarChanged(true);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarUrlInput('');
    },
  });

  // Search anime
  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
  } = useQuery({
    queryKey: ['edit-anime-search', debouncedAnimeSearch],
    queryFn: async () => {
      const { data } = await animeApi.search(debouncedAnimeSearch);
      return data.data || [];
    },
    enabled: debouncedAnimeSearch.length > 1,
    retry: 1,
  });

  const isTyping = animeSearch.length > 0 && animeSearch !== debouncedAnimeSearch;
  const searchDone = !searchLoading && debouncedAnimeSearch.length > 1;
  const hasNoResults = searchDone && searchResults?.length === 0 && !searchError;

  function addLink() {
    setLinks([...links, { label: '', url: '' }]);
    setLinksChanged(true);
  }

  function updateLink(index, field, value) {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
    setLinksChanged(true);
  }

  function removeLink(index) {
    setLinks(links.filter((_, i) => i !== index));
    setLinksChanged(true);
  }

  function handleSelectAnime(anime) {
    setSelectedAnime(anime);
    setAnimeChanged(true);
  }

  function handleAvatarUrlChange(e) {
    const url = e.target.value;
    setAvatarUrlInput(url);
    setAvatarFile(null);
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setAvatarPreview(url);
      setAvatarChanged(true);
    } else {
      setAvatarPreview(null);
      setAvatarChanged(!!url);
    }
  }

  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Formato não suportado. Use: jpg, png, gif, webp');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarUrlInput('');
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarChanged(true);
  }

  function handleRemoveAvatar() {
    setAvatarUrlInput('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarChanged(true);
  }

  function validateLinks() {
    const invalid = links.some((l) => l.url && !l.url.startsWith('http'));
    if (invalid) {
      toast.error('URLs devem começar com http:// ou https://');
      return false;
    }
    return true;
  }

  function handleNext() {
    if (step === 0 && !validateLinks()) return;
    setStep((s) => Math.min(s + 1, maxSteps - 1));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const isSaving =
    saveProfileMutation.isPending ||
    saveAnimeMutation.isPending ||
    setAvatarUrlMutation.isPending ||
    uploadAvatarMutation.isPending ||
    removeAvatarMutation.isPending;

  async function handleSave() {
    try {
      // Step 1: Save bio + links
      if (bioChanged || linksChanged) {
        await saveProfileMutation.mutateAsync({
          ...(bioChanged ? { bio } : {}),
          ...(linksChanged ? { links_sociais: links } : {}),
        });
      }

      // Step 2: Save favorite anime
      if (animeChanged && selectedAnime) {
        await saveAnimeMutation.mutateAsync(selectedAnime.mal_id);
      }

      // Step 3: Save avatar
      if (avatarChanged) {
        if (avatarFile) {
          await uploadAvatarMutation.mutateAsync(avatarFile);
        } else if (avatarUrlInput) {
          await setAvatarUrlMutation.mutateAsync(avatarUrlInput);
        } else if (avatarPreview === null && profile.avatar?.imagem_url) {
          // User removed the avatar
          await removeAvatarMutation.mutateAsync();
        }
      }

      // Refresh AuthContext user data
      const { data: freshUser } = await userApi.getMe();
      localStorage.setItem('user', JSON.stringify(freshUser));

      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', nickname] });
      queryClient.invalidateQueries({ queryKey: ['profile-trackings', nickname] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts', nickname] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', nickname] });

      toast.success('Perfil atualizado com sucesso!');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao salvar alterações';
      toast.error(msg);
    }
  }

  const hasChanges = bioChanged || linksChanged || animeChanged || avatarChanged;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Editar Perfil</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.steps}>
          {Array.from({ length: maxSteps }, (_, i) => (
            <div
              key={i}
              className={`${styles.stepDot} ${
                i === step ? styles['stepDot--active'] : ''
              } ${i < step ? styles['stepDot--done'] : ''}`}
            />
          ))}
        </div>

        <div className={styles.body}>
          {/* Step 0: Bio & Social Links */}
          {step === 0 && (
            <>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Biografia</h3>
                <div className={styles.formGroup}>
                  <label htmlFor="edit-bio">Sobre você</label>
                  <textarea
                    id="edit-bio"
                    className={`input ${isSaving ? styles.saving : ''}`}
                    placeholder="Conte um pouco sobre você e seus animes favoritos..."
                    value={bio}
                    onChange={(e) => { setBio(e.target.value); setBioChanged(true); }}
                    maxLength={500}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Links Sociais</h3>
                <p className={styles.sectionDesc}>
                  Adicione links para suas redes sociais (Twitter, Instagram, MyAnimeList, etc.)
                </p>
                {links.map((link, i) => (
                  <div key={i} className={styles.linkItem}>
                    <input
                      className={styles.linkLabel}
                      placeholder="Label (ex: Twitter)"
                      value={link.label}
                      onChange={(e) => updateLink(i, 'label', e.target.value)}
                      disabled={isSaving}
                    />
                    <input
                      className={styles.linkInput}
                      placeholder="URL (https://...)"
                      value={link.url}
                      onChange={(e) => updateLink(i, 'url', e.target.value)}
                      disabled={isSaving}
                    />
                    <button
                      className={styles.removeLinkBtn}
                      onClick={() => removeLink(i)}
                      disabled={isSaving}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button className={styles.addLinkBtn} onClick={addLink} disabled={isSaving}>
                  + Adicionar Link
                </button>
              </div>
            </>
          )}

          {/* Step 1: Favorite Anime + Avatar */}
          {step === 1 && (
            <>
              {/* Favorite Anime */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Anime Favorito</h3>
                <p className={styles.sectionDesc}>
                  Escolha seu anime favorito para exibir no perfil.
                </p>

                <div className={styles.animeSearch}>
                  <input
                    className="input"
                    placeholder="Buscar anime por título..."
                    value={animeSearch}
                    onChange={(e) => setAnimeSearch(e.target.value)}
                    autoFocus={step === 1}
                    disabled={isSaving}
                  />
                </div>

                {isTyping && (
                  <p className={styles.statusText}>
                    <span className={styles.statusDot} /> Buscando...
                  </p>
                )}
                {searchLoading && (
                  <div className="loading"><div className="spinner" /></div>
                )}
                {searchError && (
                  <p className={`${styles.statusText} ${styles['statusText--error']}`}>
                    Erro ao buscar animes. Tente novamente.
                  </p>
                )}

                {selectedAnime && (
                  <div className={styles.selectedAnimeDisplay}>
                    <ImageWithFallback
                      src={selectedAnime.images?.jpg?.image_url || ''}
                      alt={selectedAnime.title}
                    />
                    <div>
                      <div className={styles.selectedAnimeDisplay__title}>
                        {selectedAnime.title}
                      </div>
                      <div className={styles.selectedAnimeDisplay__sub}>
                        {selectedAnime.type} • {selectedAnime.episodes || '?'} eps
                        {selectedAnime.score && ` ★ ${selectedAnime.score}`}
                      </div>
                    </div>
                  </div>
                )}

                {searchResults?.length > 0 && (
                  <div className={styles.animeResults}>
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
                        <div className={styles.animeOptionInfo}>
                          <div className={styles.animeOptionTitle}>{anime.title}</div>
                          <div className={styles.animeOptionMeta}>
                            {anime.type} • {anime.episodes || '?'} eps
                            {anime.score && ` ★ ${anime.score}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasNoResults && (
                  <p className={styles.statusText}>
                    Nenhum anime encontrado para &ldquo;{debouncedAnimeSearch}&rdquo;
                  </p>
                )}
                {!animeSearch && !selectedAnime && (
                  <p className={`${styles.statusText} ${styles['statusText--muted']}`}>
                    Digite o nome do anime para buscar
                  </p>
                )}
              </div>

              {/* Avatar Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Avatar</h3>
                <p className={styles.sectionDesc}>
                  Escolha uma imagem de avatar. Você pode enviar um arquivo ou colar uma URL.
                </p>

                {/* Preview */}
                {(avatarPreview || profile.avatar?.imagem_url) && (
                  <div className={styles.avatarPreviewBox}>
                    <ImageWithFallback
                      src={avatarPreview || profile.avatar.imagem_url}
                      alt="Avatar"
                      className={styles.avatarPreviewImage}
                    />
                    <button
                      className={styles.removeAvatarBtn}
                      onClick={handleRemoveAvatar}
                      disabled={isSaving}
                    >
                      Remover avatar
                    </button>
                  </div>
                )}

                {/* File upload */}
                <div className={styles.uploadArea}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                    disabled={isSaving}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    Enviar arquivo
                  </button>
                  <span className={styles.uploadHint}>ou</span>
                </div>

                {/* URL input */}
                <div className={styles.urlInputGroup}>
                  <input
                    className="input"
                    type="url"
                    placeholder="https://... URL da imagem"
                    value={avatarUrlInput}
                    onChange={handleAvatarUrlChange}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            Passo <strong>{step + 1}</strong> de {maxSteps}
          </div>
          <div className={styles.footerActions}>
            {step > 0 && (
              <button className="btn btn-secondary" onClick={handleBack} disabled={isSaving}>
                Voltar
              </button>
            )}
            {step < maxSteps - 1 ? (
              <button className="btn btn-primary" onClick={handleNext} disabled={isSaving}>
                Próximo
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
