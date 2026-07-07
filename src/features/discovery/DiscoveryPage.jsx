import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { animeApi } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import AnimeCard from '../../components/AnimeCard';
import styles from './DiscoveryPage.module.scss';

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
      return { animes: data.data || [], pagination: data.pagination || {} };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !isSearching && category === 'trending',
  });

  // Season (Temporada)
  const seasonQuery = useQuery({
    queryKey: ['anime-season', page],
    queryFn: async () => {
      const { data } = await animeApi.getSeason(undefined, undefined, page);
      return { animes: data.data || [], pagination: data.pagination || {} };
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
      return { animes: data.data || [], pagination: data.pagination || {} };
    },
    enabled: isSearching,
    staleTime: 60 * 1000,
  });

  // Determine current data source
  let currentData, isLoading, sectionTitle, pagination;

  if (isSearching) {
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
  pagination = currentData?.pagination;
  const totalPages = pagination?.last_visible_page || 1;
  const hasNextPage = pagination?.has_next_page || false;
  const totalItems = pagination?.items?.total;

  // Extract unique genres from results
  const genreOptions = useMemo(() => {
    const genreMap = new Map();
    for (const anime of rawAnimes) {
      if (anime.genres) {
        for (const g of anime.genres) {
          if (!genreMap.has(g.mal_id)) {
            genreMap.set(g.mal_id, g.name);
          }
        }
      }
    }
    return [{ mal_id: '', name: 'Todos os gêneros' }, ...Array.from(genreMap, ([id, name]) => ({ mal_id: id, name }))];
  }, [rawAnimes]);

  // Apply filters
  const filteredAnimes = useMemo(() => {
    let result = rawAnimes;

    if (selectedGenre) {
      const genreId = parseInt(selectedGenre, 10);
      result = result.filter((a) => a.genres?.some((g) => g.mal_id === genreId));
    }

    if (minScore > 0) {
      result = result.filter((a) => a.score && a.score >= minScore);
    }

    if (selectedType) {
      result = result.filter((a) => a.type?.toLowerCase() === selectedType);
    }

    return result;
  }, [rawAnimes, selectedGenre, minScore, selectedType]);

  const hasActiveFilters = selectedGenre || minScore > 0 || selectedType;
  const hasError = !isSearching && category === 'trending' && trendingQuery.error;

  function clearFilters() {
    setSelectedGenre('');
    setMinScore(0);
    setSelectedType('');
  }

  function handleChangeCategory(newCategory) {
    setCategory(newCategory);
    clearFilters();
  }

  // Reset genre if it no longer exists in current data
  useEffect(() => {
    if (rawAnimes.length > 0 && selectedGenre) {
      const genreId = parseInt(selectedGenre, 10);
      const exists = rawAnimes.some((a) => a.genres?.some((g) => g.mal_id === genreId));
      if (!exists) setSelectedGenre('');
    }
  }, [rawAnimes, selectedGenre]);

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
            <select
              className={styles.filterSelect}
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              {genreOptions.map((g) => (
                <option key={g.mal_id} value={g.mal_id}>
                  {g.name}
                </option>
              ))}
            </select>
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
          Erro ao carregar animes. Tente novamente mais tarde.
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
