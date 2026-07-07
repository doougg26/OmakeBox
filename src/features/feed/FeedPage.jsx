import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedApi, animeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Avatar from '../../components/Avatar';
import ImageWithFallback from '../../components/ImageWithFallback';
import SpoilerBlock from '../../components/SpoilerBlock';
import styles from './FeedPage.module.scss';

export default function FeedPage() {
  useDocumentTitle('Feed Social');
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showComments, setShowComments] = useState({});

  // Estado do formulário de post
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [postText, setPostText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [searchStep, setSearchStep] = useState(true); // true = busca anime, false = escrever post
  const [postError, setPostError] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const postTextRef = useRef(null);

  // Busca feed
  const { data: feedData, isLoading } = useQuery({
    queryKey: ['feed', page],
    queryFn: async () => {
      const { data } = await feedApi.getFeed(page);
      return data || { posts: [], pagination: {} };
    },
  });

  const posts = feedData?.posts || [];
  const hasMore = feedData?.pagination?.has_more || false;

  // Busca animes para o formulário
  const { data: searchResults } = useQuery({
    queryKey: ['anime-search-feed', debouncedSearch],
    queryFn: async () => {
      const { data } = await animeApi.search(debouncedSearch);
      return data.data || [];
    },
    enabled: debouncedSearch.length > 1,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async ({ animeMalId, texto, marcado_como_spoiler }) => {
      await feedApi.createPost({ animeMalId, texto, marcado_como_spoiler });
    },
    onSuccess: () => {
      setShowNewPost(false);
      setSelectedAnime(null);
      setPostText('');
      setIsSpoiler(false);
      setSearchQuery('');
      setSearchStep(true);
      setPostError('');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Erro ao criar post. Verifique se o backend está rodando.';
      setPostError(msg);
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (postId) => {
      await feedApi.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ postId, texto }) => {
      await feedApi.addComment(postId, texto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post-detail'] });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      await feedApi.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  function handleSelectAnime(anime) {
    setSelectedAnime(anime);
    setSearchStep(false);
    setTimeout(() => postTextRef.current?.focus(), 100);
  }

  function handleSubmitPost() {
    if (!selectedAnime || !postText.trim()) return;
    createPostMutation.mutate({
      animeMalId: selectedAnime.mal_id,
      texto: postText.trim(),
      marcado_como_spoiler: isSpoiler,
    });
  }

  // Busca post individual com comentários quando a seção de comentários é aberta
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  const { data: activePost } = useQuery({
    queryKey: ['post-detail', activeCommentPost],
    queryFn: async () => {
      if (!activeCommentPost) return null;
      const { data } = await feedApi.getPost(activeCommentPost);
      return data;
    },
    enabled: !!activeCommentPost,
  });

  function handleToggleComments(postId) {
    const willShow = !showComments[postId];
    // Fecha todos os outros ao abrir um novo (accordion) para sync com activeCommentPost
    if (willShow) {
      setShowComments({ [postId]: true });
      setActiveCommentPost(postId);
    } else {
      setShowComments({});
      setActiveCommentPost(null);
    }
  }

  function handleSubmitComment(postId, e) {
    e.preventDefault();
    const input = e.target.querySelector('input');
    if (!input?.value.trim()) return;
    commentMutation.mutate({ postId, texto: input.value.trim() });
    input.value = '';
  }

  async function handleDeletePost(postId) {
    const confirmed = await toast.confirm('Remover este post?');
    if (confirmed) {
      deletePostMutation.mutate(postId, {
        onSuccess: () => toast.success('Post removido'),
        onError: () => toast.error('Erro ao remover post'),
      });
    }
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString('pt-BR');
  }

  return (
    <div className={`container ${styles.feedPage}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Feed <span>Social</span>
        </h1>
        <p className={styles.subtitle}>
          Compartilhe suas impressões sobre animes com a comunidade
        </p>
      </div>

      {/* Botão novo post */}
      {isAuthenticated && !showNewPost && (
        <button
          className={styles.newPostBtn}
          onClick={() => setShowNewPost(true)}
        >
          + Novo Post
        </button>
      )}

      {/* Formulário de novo post */}
      {isAuthenticated && showNewPost && (
        <div className={styles.newPostForm}>
          <div className={styles.newPostForm__header}>
            <h3>Criar Post</h3>
            <button
              className={styles.newPostForm__close}
              onClick={() => {
                setShowNewPost(false);
                setSelectedAnime(null);
                setPostText('');
                setSearchStep(true);
                setSearchQuery('');
              }}
            >
              ×
            </button>
          </div>

          {searchStep ? (
            <>
              <p className={styles.newPostForm__label}>
                Busque um anime para vincular ao post:
              </p>
              <input
                className={`input ${styles.newPostForm__search}`}
                type="text"
                placeholder="Buscar anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <div className={styles.animeSearchResults}>
                {searchResults?.slice(0, 10).map((anime) => (
                  <div
                    key={anime.mal_id}
                    className={styles.animeSearchItem}
                    onClick={() => handleSelectAnime(anime)}
                  >
                    <img
                      src={anime.images?.jpg?.image_url || ''}
                      alt={anime.title}
                    />
                    <div>
                      <div className={styles.animeSearchItem__title}>
                        {anime.title}
                      </div>
                      <div className={styles.animeSearchItem__meta}>
                        {anime.type} • {anime.episodes || '?'} eps
                        {anime.score && ` • ★ ${anime.score}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.selectedAnime}>
                <img
                  src={selectedAnime?.images?.jpg?.image_url || ''}
                  alt={selectedAnime?.title}
                />
                <div>
                  <div className={styles.selectedAnime__title}>
                    {selectedAnime?.title}
                  </div>
                  <button
                    className={styles.selectedAnime__change}
                    onClick={() => {
                      setSearchStep(true);
                      setSelectedAnime(null);
                    }}
                  >
                    Trocar anime
                  </button>
                </div>
              </div>

              <textarea
                ref={postTextRef}
                className="input"
                placeholder="O que você achou deste anime?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                maxLength={2000}
                rows={3}
              />

              <div className={styles.newPostForm__options}>
                <label className={styles.spoilerToggle}>
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                  />
                  <span>Contém spoiler</span>
                </label>
                <span className={styles.charCount}>
                  {postText.length}/2000
                </span>
              </div>

              {postError && (
                <div className={styles.postError}>
                  {postError}
                </div>
              )}

              <div className={styles.newPostForm__actions}>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitPost}
                  disabled={!postText.trim() || createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? 'Publicando...' : 'Publicar'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchStep(true);
                    setSelectedAnime(null);
                    setPostText('');
                    setPostError('');
                  }}
                >
                  Voltar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className={styles.skeletonFeed}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonPost}>
              <div className={styles.skeletonPost__header}>
                <div className={styles.skeletonPost__avatar} />
                <div className={styles.skeletonPost__info}>
                  <div className={styles.skeletonPost__line} style={{ width: '120px' }} />
                  <div className={styles.skeletonPost__line} style={{ width: '80px' }} />
                </div>
              </div>
              <div className={styles.skeletonPost__banner} />
              <div className={styles.skeletonPost__line} style={{ width: '60%' }} />
              <div className={styles.skeletonPost__line} style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className={styles.emptyFeed}>
          <div className={styles.emptyFeed__icon}>📢</div>
          <h3>Nenhum post ainda</h3>
          <p>Seja o primeiro a compartilhar sua opinião sobre um anime!</p>
          {isAuthenticated && (
            <button
              className="btn btn-primary"
              onClick={() => setShowNewPost(true)}
            >
              Criar Primeiro Post
            </button>
          )}
        </div>
      ) : (
        <div className={styles.feedList}>
          {posts.map((post) => (
            <article key={post.id} className={styles.feedPost}>
              {/* Cabeçalho */}
              <div className={styles.feedPost__header}>
                <div className={styles.feedPost__user}>
                  <Avatar
                    src={post.user?.avatar?.imagem_url}
                    nickname={post.user?.nickname}
                    size="md"
                  />
                  <div>
                    <Link
                      to={`/perfil/${post.user?.nickname}`}
                      className={styles.feedPost__nickname}
                    >
                      {post.user?.nickname}
                    </Link>
                    <span className={styles.feedPost__time}>
                      {formatDate(post.criado_em)}
                    </span>
                  </div>
                </div>

                <div className={styles.feedPost__actions}>
                  {/* Link para comunidade */}
                  <Link
                    to={`/anime/${post.anime?.mal_id}`}
                    className={styles.feedPost__anime}
                  >
                    {post.anime?.titulo}
                  </Link>

                  {/* Delete */}
                  {user?.id === post.user?.id && (
                    <button
                      className={styles.feedPost__delete}
                      onClick={() => handleDeletePost(post.id)}
                      title="Remover post"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Banner do anime */}
              {post.anime?.capa_url && (
                <Link
                  to={`/anime/${post.anime?.mal_id}`}
                  className={styles.feedPost__banner}
                >
                  <ImageWithFallback src={post.anime.capa_url} alt={post.anime.titulo} />
                </Link>
              )}

              {/* Texto do post */}
              <div className={styles.feedPost__content}>
                {post.marcado_como_spoiler ? (
                  <SpoilerBlock>
                    <p className={styles.feedPost__text}>{post.texto}</p>
                  </SpoilerBlock>
                ) : (
                  <p className={styles.feedPost__text}>{post.texto}</p>
                )}
              </div>

              {/* Ações: like, comentar */}
              <div className={styles.feedPost__footer}>
                <button
                  className={styles.feedPost__likeBtn}
                  onClick={() => likeMutation.mutate(post.id)}
                  disabled={!isAuthenticated}
                >
                  ❤ {post.likes_count || 0}
                </button>
                <button
                  className={styles.feedPost__commentBtn}
                  onClick={() => handleToggleComments(post.id)}
                >
                  💬 {post.comment_count || 0}
                </button>
              </div>

              {/* Comentários */}
              {showComments[post.id] && (
                <div className={styles.comments}>
                  {isAuthenticated && (
                    <form
                      className={styles.commentForm}
                      onSubmit={(e) => handleSubmitComment(post.id, e)}
                    >
                      <input
                        className="input"
                        type="text"
                        placeholder="Escreva um comentário..."
                        maxLength={1000}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={commentMutation.isPending}
                      >
                        Enviar
                      </button>
                    </form>
                  )}

                  {activeCommentPost === post.id && (
                    <div className={styles.comments__list}>
                      {activePost?.comments?.length > 0 ? (
                        activePost.comments.map((comment) => (
                          <div key={comment.id} className={styles.comment}>
                            <Avatar
                              src={comment.user?.avatar?.imagem_url}
                              nickname={comment.user?.nickname}
                              size="sm"
                            />
                            <div className={styles.comment__body}>
                              <div className={styles.comment__header}>
                                <Link
                                  to={`/perfil/${comment.user?.nickname}`}
                                  className={styles.comment__nickname}
                                >
                                  {comment.user?.nickname}
                                </Link>
                                <span className={styles.comment__time}>
                                  {formatDate(comment.criado_em)}
                                </span>
                              </div>
                              <p className={styles.comment__text}>
                                {comment.texto}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className={styles.comments__empty}>
                          Nenhum comentário ainda.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}

          {/* Paginação */}
          <div className={styles.pagination}>
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Anterior
            </button>
            <span className={styles.pagination__info}>Página {page}</span>
            <button
              className="btn btn-secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
            >
              Próximo →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
