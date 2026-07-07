import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Icon from '../../components/Icon';
import ImageWithFallback from '../../components/ImageWithFallback';
import styles from './StatsPage.module.scss';

export default function StatsPage() {
  useDocumentTitle('Estatísticas');

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await api.get('/stats');
      return response.data;
    },
    refetchInterval: 60000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page">
        <div className="container">
          <p className="error-text">Erro ao carregar estatísticas: {error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className={styles.title}>Estatísticas</h1>
        <p className={styles.subtitle}>Os destaques da comunidade OmakeBox</p>

        <div className={styles.grid}>
          {/* Anime com mais estrelas */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="star" size={22} />
              <h2>Animes Mais Bem Avaliados</h2>
            </div>
            <div className={styles.cardBody}>
              {stats?.top_rated_animes?.length > 0 ? (
                <ol className={styles.ranking}>
                  {stats.top_rated_animes.map((item, i) => (
                    <li key={'rank-' + i} className={styles.rankingItem}>
                      <span className={styles.rank}>{i + 1}</span>
                      <ImageWithFallback
                        src={item.anime?.capa_url || ''}
                        alt={item.anime?.titulo || ''}
                        className={styles.thumb}
                      />
                      <div className={styles.itemInfo}>
                        <Link to={`/anime/${item.anime?.mal_id}`} className={styles.itemTitle}>
                          {item.anime?.titulo || 'Desconhecido'}
                        </Link>
                        <span className={styles.itemMeta}>
                          <Icon name="starFilled" size={12} /> {item.media} ({item.total_votos} {item.total_votos === 1 ? 'voto' : 'votos'})
                        </span>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{ width: `${(parseFloat(item.media) / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.empty}>Nenhum anime avaliado ainda. Seja o primeiro!</p>
              )}
            </div>
          </section>

          {/* Personagem mais votado */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="users" size={22} />
              <h2>Personagem mais Votado</h2>
            </div>
            <div className={styles.cardBody}>
              {stats?.most_voted_character ? (
                <div className={styles.featured}>
                  <ImageWithFallback
                    src={stats.most_voted_character.character?.imagem_url || ''}
                    alt={stats.most_voted_character.character?.nome || ''}
                    className={styles.featuredImg}
                  />
                  <strong className={styles.featuredName}>
                    {stats.most_voted_character.character?.nome}
                  </strong>
                  <span className={styles.featuredMeta}>
                    {stats.most_voted_character.total_votos} {stats.most_voted_character.total_votos === 1 ? 'voto' : 'votos'}
                  </span>
                  {stats.most_voted_character.anime && (
                    <Link
                      to={`/anime/${stats.most_voted_character.anime.mal_id}`}
                      className={styles.featuredLink}
                    >
                      {stats.most_voted_character.anime.titulo}
                    </Link>
                  )}
                </div>
              ) : (
                <p className={styles.empty}>Nenhum voto em personagem ainda.</p>
              )}
            </div>
          </section>

          {/* Usuário com mais episódios */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="barChart" size={22} />
              <h2>Maior Vigilante</h2>
            </div>
            <div className={styles.cardBody}>
              {stats?.most_episodes_user ? (
                <div className={styles.featured}>
                  <div className={styles.avatarWrapper}>
                    {stats.most_episodes_user.user?.avatar_url ? (
                      <img
                        src={stats.most_episodes_user.user.avatar_url}
                        alt={stats.most_episodes_user.user.nickname}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        {stats.most_episodes_user.user?.nickname?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <strong className={styles.featuredName}>
                    {stats.most_episodes_user.user?.nickname}
                  </strong>
                  <span className={styles.featuredMeta}>
                    <Icon name="play" size={12} /> {stats.most_episodes_user.total_episodios} episódios assistidos
                  </span>
                  <Link
                    to={`/perfil/${stats.most_episodes_user.user?.nickname}`}
                    className={styles.featuredLink}
                  >
                    Ver Perfil
                  </Link>
                </div>
              ) : (
                <p className={styles.empty}>Nenhum episódio assistido ainda.</p>
              )}
            </div>
          </section>

          {/* Postagem mais curtida */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="heart" size={22} />
              <h2>Postagem mais Curtida</h2>
            </div>
            <div className={styles.cardBody}>
              {stats?.most_liked_post ? (
                <div className={styles.featured}>
                  <div className={styles.postPreview}>
                    <p className={styles.postText}>
                      {stats.most_liked_post.post?.texto}
                    </p>
                  </div>
                  <div className={styles.postMeta}>
                    <span className={styles.featuredMeta}>
                      <Icon name="heart" size={12} /> {stats.most_liked_post.post?.likes_count} curtidas
                    </span>
                    {stats.most_liked_post.user && (
                      <span className={styles.featuredMeta}>
                        por {stats.most_liked_post.user.nickname}
                      </span>
                    )}
                    {stats.most_liked_post.anime && (
                      <Link
                        to={`/feed`}
                        className={styles.featuredLink}
                      >
                        Ver no Feed
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>Nenhuma postagem ainda.</p>
              )}
            </div>
          </section>

          {/* Gênero mais popular */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="tag" size={22} />
              <h2>Gênero mais Popular</h2>
            </div>
            <div className={styles.cardBody}>
              {stats?.most_popular_genre ? (
                <div className={styles.featured}>
                  <span className={styles.genreBadge}>
                    {stats.most_popular_genre.nome}
                  </span>
                  <span className={styles.featuredMeta}>
                    {stats.most_popular_genre.total_trackings} {stats.most_popular_genre.total_trackings === 1 ? 'tracking' : 'trackings'}
                  </span>
                </div>
              ) : (
                <p className={styles.empty}>Nenhum gênero registrado ainda.</p>
              )}
            </div>
          </section>

          {/* Ano com mais lançamentos */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="calendar" size={22} />
              <h2>Ano com mais Lançamentos</h2>
            </div>
            <div className={styles.cardBody}>
              {stats?.year_most_releases ? (
                <div className={styles.featured}>
                  <span className={styles.yearBig}>{stats.year_most_releases.ano}</span>
                  <span className={styles.featuredMeta}>
                    {stats.year_most_releases.total_animes} {stats.year_most_releases.total_animes === 1 ? 'anime lançado' : 'animes lançados'}
                  </span>
                </div>
              ) : (
                <p className={styles.empty}>Nenhum ano registrado ainda.</p>
              )}
            </div>
          </section>

          {/* Usuário com mais avaliações */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Icon name="star" size={22} />
              <h2>Maior Avaliador</h2>
            </div>
            <div className={styles.cardBody}>
              {stats?.most_reviews_user ? (
                <div className={styles.featured}>
                  <div className={styles.avatarWrapper}>
                    {stats.most_reviews_user.user?.avatar_url ? (
                      <img
                        src={stats.most_reviews_user.user.avatar_url}
                        alt={stats.most_reviews_user.user.nickname}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        {stats.most_reviews_user.user?.nickname?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <strong className={styles.featuredName}>
                    {stats.most_reviews_user.user?.nickname}
                  </strong>
                  <span className={styles.featuredMeta}>
                    <Icon name="starFilled" size={12} /> {stats.most_reviews_user.total_avaliacoes} {stats.most_reviews_user.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                  <span className={styles.featuredMeta}>
                    Média: {stats.most_reviews_user.media_nota}
                  </span>
                  <Link
                    to={`/perfil/${stats.most_reviews_user.user?.nickname}`}
                    className={styles.featuredLink}
                  >
                    Ver Perfil
                  </Link>
                </div>
              ) : (
                <p className={styles.empty}>Nenhuma avaliação ainda.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

