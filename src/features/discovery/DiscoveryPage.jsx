import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animeApi } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import AnimeCard from '../../components/AnimeCard';
import styles from './DiscoveryPage.module.scss';

const JIKAN_GENRES = [
  // ═══ Mais populares (sempre visíveis como pills) ═══
  { mal_id: 1, name: 'Ação' },
  { mal_id: 2, name: 'Aventura' },
  { mal_id: 4, name: 'Comédia' },
  { mal_id: 8, name: 'Drama' },
  { mal_id: 10, name: 'Fantasia' },
  { mal_id: 22, name: 'Romance' },
  { mal_id: 36, name: 'Slice of Life' },
  { mal_id: 24, name: 'Ficção Científica' },
  { mal_id: 27, name: 'Shounen' },
  { mal_id: 42, name: 'Seinen' },
  { mal_id: 14, name: 'Terror' },
  // ═══ Populares (aparecem ao expandir) ═══
  { mal_id: 41, name: 'Suspense' },
  { mal_id: 37, name: 'Sobrenatural' },
  { mal_id: 17, name: 'Isekai' },
  { mal_id: 18, name: 'Mecha' },
  { mal_id: 30, name: 'Esportes' },
  { mal_id: 7, name: 'Mistério' },
  { mal_id: 40, name: 'Psicológico' },
  { mal_id: 6, name: 'Demônios' },
  { mal_id: 31, name: 'Super Poderes' },
  { mal_id: 23, name: 'Escolar' },
  { mal_id: 19, name: 'Musical' },
  { mal_id: 13, name: 'Histórico' },
  { mal_id: 21, name: 'Samurai' },
  { mal_id: 39, name: 'Policial' },
  { mal_id: 38, name: 'Militares' },
  { mal_id: 11, name: 'Game' },
  { mal_id: 9, name: 'Ecchi' },
  { mal_id: 35, name: 'Harem' },
  { mal_id: 25, name: 'Shoujo' },
  { mal_id: 43, name: 'Josei' },
  { mal_id: 32, name: 'Vampiros' },
  { mal_id: 48, name: 'Premiado' },
  { mal_id: 15, name: 'Infantil' },
  { mal_id: 20, name: 'Paródia' },
  { mal_id: 46, name: 'Aventura na Faculdade' },
  { mal_id: 47, name: 'Gourmet' },
  { mal_id: 49, name: 'Trabalho' },
  { mal_id: 29, name: 'Espaço' },
  { mal_id: 3, name: 'Carros' },
  // ═══ Nicho ═══
  { mal_id: 26, name: 'Shoujo Ai' },
  { mal_id: 28, name: 'Shounen Ai' },
  { mal_id: 5, name: 'Dementia' },
  { mal_id: 12, name: 'Hentai' },
  { mal_id: 16, name: 'Japonês' },
];

const CATEGORIES = [
  { id: 'season', label: 'Temporada' },
  { id: 'trending', label: 'Em Alta' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'tv', label: 'TV' },
  { value: 'movie', label: 'Filme' },
  { value: 'ova', label: 'OVA' },
  { value: 'special', label: 'Especial' },
  { value: 'ona', label: 'ONA' },
];

const SCORE_OPTIONS = [
  { value: 0, label: 'Qualquer' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' },
];

function getCurrentSeasonLabel() {
  const month = new Date().getMonth();
  const seasons = [
    { months: [0, 1, 2], label: 'Inverno' },
    { months: [3, 4, 5], label: 'Primavera' },
    { months: [6, 7, 8], label: 'Verão' },
    { months: [9, 10, 11], label: 'Outono' },
  ];
  const current = seasons.find((s) => s.months.includes(month));
  return current?.label || '';
}

export default function DiscoveryPage() {
  useDocumentTitle('Discovery');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('season');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Reset page when category, search, or filters change
  useEffect(() => { setPage(1); }, [category, debouncedSearch, selectedGenre, minScore, selectedType]);

  const isSearching = !!debouncedSearch;

  // Trending (Em Alta)
  const trendingQuery = useQuery({
    queryKey: ['anime-trending', page],
    queryFn: async () => {
      const { data } = await animeApi.getTrending(page);
      return { animes: data.data || [], pagination: data.pagination || {}, _stale: !!data._stale };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !isSearching && category === 'trending',
  });

  // Season (Temporada)
  const seasonQuery = useQuery({
    queryKey: ['anime-season', page],
    queryFn: async () => {
      const { data } = await animeApi.getSeason(undefined, undefined, page);
      return { animes: data.data || [], pagination: data.pagination || {}, _stale: !!data._stale };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !isSearching && category === 'season',
  });

  // Search
  const searchQuery_result = useQuery({
    queryKey: ['anime-search', debouncedSearch, page],
    queryFn: async () => {
      if (!debouncedSearch) return null;
      const { data } = await animeApi.search(debouncedSearch, page);
      return { animes: data.data || [], pagination: data.pagination || {}, _stale: !!data._stale };
    },
    enabled: isSearching,
    staleTime: 60 * 1000,
  });

  // Genre filter via API (busca todos os animes do gênero, sem limitação de página)
  const genreQuery = useQuery({
    queryKey: ['anime-by-genre', selectedGenre, page],
    queryFn: async () => {
      const { data } = await animeApi.getByGenre(selectedGenre, page);
      return { animes: data.data || [], pagination: data.pagination || {}, _stale: !!data._stale };
    },
    enabled: !!selectedGenre,
    staleTime: 5 * 60 * 1000,
  });

  // Determine current data source
  let currentData, isLoading, sectionTitle, pagination;

  if (!!selectedGenre) {
    // Quando um gênero é selecionado, busca da API diretamente (qualquer página)
    currentData = genreQuery.data;
    isLoading = genreQuery.isLoading;
    const genreName = JIKAN_GENRES.find(g => g.mal_id === parseInt(selectedGenre))?.name || 'Gênero';
    sectionTitle = `Gênero: ${genreName}`;
  } else if (isSearching) {
    currentData = searchQuery_result.data;
    isLoading = searchQuery_result.isLoading;
    sectionTitle = `Resultados para: "${debouncedSearch}"`;
  } else if (category === 'season') {
    currentData = seasonQuery.data;
    isLoading = seasonQuery.isLoading;
    sectionTitle = `Temporada ${getCurrentSeasonLabel()} ${new Date().getFullYear()}`;
  } else {
    currentData = trendingQuery.data;
    isLoading = trendingQuery.isLoading;
    sectionTitle = 'Em Alta';
  }

  const rawAnimes = currentData?.animes || [];
  const isStale = currentData?._stale || false;
  pagination = currentData?.pagination;
  const totalPages = pagination?.last_visible_page || 1;
  const hasNextPage = pagination?.has_next_page || false;
  const totalItems = pagination?.items?.total;

  // Apply filters (sem filtro de gênero — agora é servidor-side via API)
  const filteredAnimes = useMemo(() => {
    let result = rawAnimes;

    if (minScore > 0) {
      result = result.filter((a) => a.score && a.score >= minScore);
    }

    if (selectedType) {
      result = result.filter((a) => a.type?.toLowerCase() === selectedType);
    }

    return result;
  }, [rawAnimes, minScore, selectedType]);

  const hasActiveFilters = selectedGenre || minScore > 0 || selectedType;
  const hasTrendingError = !isSearching && !selectedGenre && category === 'trending' && trendingQuery.error;
  const hasSeasonError = !isSearching && !selectedGenre && category === 'season' && seasonQuery.error;
  const hasSearchError = isSearching && searchQuery_result.error;
  const hasGenreError = !!selectedGenre && genreQuery.error;
  const hasError = hasTrendingError || hasSeasonError || hasSearchError || hasGenreError;

  function clearFilters() {
    setSelectedGenre('');
    setMinScore(0);
    setSelectedType('');
  }

  function handleChangeCategory(newCategory) {
    setCategory(newCategory);
    clearFilters();
  }

  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className={`container ${styles['discovery-page']}`}>
      <div className={styles['discovery-header']}>
        <h1 className={styles['discovery-title']}>
          Descubra <span>Animes</span>
        </h1>

        <div className={styles['discovery-search']}>
          <input
            className="input"
            type="text"
            placeholder="Buscar animes por título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!isSearching && (
        <div className={styles.categoryTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.categoryTab} ${category === cat.id ? styles['categoryTab--active'] : ''}`}
              onClick={() => handleChangeCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
          {searchQuery && !debouncedSearch && (
            <span className={styles.categoryTab__typing}>Buscando...</span>
          )}
        </div>
      )}

      {isSearching && (
        <div className={styles.categoryTabs}>
          <button className={`${styles.categoryTab} ${styles['categoryTab--search']}`}>
            Busca
          </button>
          <button
            className={styles.categoryTab}
            onClick={() => {
              setSearchQuery('');
              setCategory('season');
            }}
          >
            Limpar busca
          </button>
        </div>
      )}

      {/* Filter Bar */}
      {!isLoading && rawAnimes.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Gênero</label>
            <div className={styles.genrePills}>
              <button
                className={`${styles.filterPill} ${!selectedGenre ? styles['filterPill--active'] : ''}`}
                onClick={() => { setSelectedGenre(''); setShowAllGenres(false); }}
              >
                Todos
              </button>
              {(showAllGenres ? JIKAN_GENRES : JIKAN_GENRES.slice(0, 11)).map((g) => (
                <button
                  key={g.mal_id}
                  className={`${styles.filterPill} ${selectedGenre === String(g.mal_id) ? styles['filterPill--active'] : ''}`}
                  onClick={() => setSelectedGenre(selectedGenre === String(g.mal_id) ? '' : String(g.mal_id))}
                >
                  {g.name}
                </button>
              ))}
              {JIKAN_GENRES.length > 11 && (
                <button
                  className={styles.genreToggle}
                  onClick={() => setShowAllGenres(!showAllGenres)}
                >
                  {showAllGenres ? '− Mostrar menos' : `+${JIKAN_GENRES.length - 11} Mais`}
                </button>
              )}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Tipo</label>
            <div className={styles.filterPills}>
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.filterPill} ${selectedType === opt.value ? styles['filterPill--active'] : ''}`}
                  onClick={() => setSelectedType(opt.value === selectedType ? '' : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Nota Mín.</label>
            <div className={styles.filterPills}>
              {SCORE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.filterPill} ${minScore === opt.value ? styles['filterPill--active'] : ''}`}
                  onClick={() => setMinScore(minScore === opt.value ? 0 : opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button className={styles.filterClear} onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Stale cache warning */}
      {isStale && !isLoading && (
        <div className={styles.staleBanner}>
          <span className={styles.staleBanner__icon}>⚠️</span>
          <span>Dados podem estar desatualizados — a Jikan API está temporariamente indisponível</span>
        </div>
      )}

      <h2 className={styles['section-title']}>
        {sectionTitle}
        {totalItems && !hasActiveFilters && (
          <span className={styles['section-title__count']}>
            {totalItems} anime{totalItems !== 1 ? 's' : ''}
          </span>
        )}
        {hasActiveFilters && !isLoading && (
          <span className={styles['section-title__count']}>
            {filteredAnimes.length} resultado{filteredAnimes.length !== 1 ? 's' : ''}
          </span>
        )}
      </h2>

      {isLoading && (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonBody}>
                <div className={`${styles.skeletonLine} ${styles['skeletonLine--medium']}`} />
                <div className={`${styles.skeletonLine} ${styles['skeletonLine--short']}`} />
                <div className={styles.skeletonMeta}>
                  <div className={styles.skeletonMetaLine} />
                  <div className={styles.skeletonMetaLine} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && hasError && (
        <div className="error-text">
          {hasSearchError
            ? 'Serviço de busca temporariamente indisponível. A fonte de dados (MyAnimeList) pode estar inacessível. Tente novamente mais tarde.'
            : 'Erro ao carregar animes. Tente novamente mais tarde.'}
        </div>
      )}

      {!isLoading && filteredAnimes.length === 0 && !hasError && (
        <p className={styles.emptyText}>
          {hasActiveFilters
            ? 'Nenhum anime encontrado com os filtros selecionados.'
            : isSearching
              ? 'Nenhum anime encontrado para esta busca.'
              : category === 'season'
                ? 'Nenhum anime disponível para esta temporada.'
                : 'Nenhum anime disponível no momento.'}
        </p>
      )}

      {!isLoading && (
        <div key={`grid-${category}-${page}-${isSearching ? 'search' : ''}`} className={styles['anime-grid']}>
          {filteredAnimes.map((anime, i) => (
            <AnimeCard key={`${anime.mal_id}-${i}`} anime={anime} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className={styles.pagination}>
          <button
            className={styles.pagination__btn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ‹ Anterior
          </button>

          <div className={styles.pagination__pages}>
            {pageNumbers[0] > 1 && (
              <>
                <button className={styles.pagination__page} onClick={() => setPage(1)}>1</button>
                {pageNumbers[0] > 2 && <span className={styles.pagination__ellipsis}>…</span>}
              </>
            )}
            {pageNumbers.map((p) => (
              <button
                key={p}
                className={`${styles.pagination__page} ${p === page ? styles['pagination__page--active'] : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className={styles.pagination__ellipsis}>…</span>
                )}
                <button className={styles.pagination__page} onClick={() => setPage(totalPages)}>
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            className={styles.pagination__btn}
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
          >
            Próximo ›
          </button>
        </div>
      )}
    </div>
  );
}
