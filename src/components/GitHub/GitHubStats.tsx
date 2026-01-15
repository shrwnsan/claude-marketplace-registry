import React, { useState, useEffect } from 'react';
import { Star, GitBranch, GitCommit, Users, Eye, AlertCircle } from 'lucide-react';

interface GitHubStatsProps {
  repository: string;
  className?: string;
}

interface RepoStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string;
  createdAt: string;
  updatedAt: string;
  defaultBranch: string;
  size: number;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  };
  topics: string[];
  description?: string;
  homepage?: string;
  subscribersCount: number;
  networkCount: number;
}

interface CommitData {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

interface ContributorData {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

const GitHubStats: React.FC<GitHubStatsProps> = ({ repository, className = '' }) => {
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [contributors, setContributors] = useState<ContributorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!repository) return;

      setLoading(true);
      setError(null);

      try {
        // Parse repository URL to get owner and repo name
        const [owner, repo] = repository.replace('https://github.com/', '').split('/');

        // Fetch repository data
        const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!repoResponse.ok) {
          throw new Error(`GitHub API error: ${repoResponse.statusText}`);
        }

        const repoData: RepoStats = await repoResponse.json();

        // Ensure all numeric fields have default values
        const safeStats: RepoStats = {
          stars: repoData.stars || 0,
          forks: repoData.forks || 0,
          watchers: repoData.watchers || 0,
          openIssues: repoData.openIssues || 0,
          language: repoData.language || 'Unknown',
          createdAt: repoData.createdAt || new Date().toISOString(),
          updatedAt: repoData.updatedAt || new Date().toISOString(),
          defaultBranch: repoData.defaultBranch || 'main',
          size: repoData.size || 0,
          license: repoData.license,
          topics: repoData.topics || [],
          description: repoData.description,
          homepage: repoData.homepage,
          subscribersCount: repoData.subscribersCount || 0,
          networkCount: repoData.networkCount || 0,
        };

        setStats(safeStats);

        // Fetch recent commits
        const commitsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`
        );
        if (commitsResponse.ok) {
          const commitsData = await commitsResponse.json();
          setCommits(
            commitsData.map((commit: any) => ({
              sha: commit.sha,
              message: commit.commit?.message || 'No message',
              author: {
                name: commit.commit?.author?.name || 'Unknown',
                email: commit.commit?.author?.email || '',
                date: commit.commit?.author?.date || new Date().toISOString(),
              },
              url: commit.html_url,
            }))
          );
        }

        // Fetch contributors
        const contributorsResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`
        );
        if (contributorsResponse.ok) {
          const contributorsData: ContributorData[] = await contributorsResponse.json();
          setContributors(contributorsData);
        }
      } catch (err) {
        console.error('Error fetching GitHub data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch GitHub data');
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [repository]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4'></div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-20 bg-gray-300 dark:bg-gray-700 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card ${className}`}>
        <div className='text-center py-8'>
          <div className='text-gray-400 dark:text-gray-500 mb-4'>
            <GitBranch className='w-12 h-12 mx-auto' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
            GitHub Data Unavailable
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Repository Overview */}
      <div className='card'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center'>
          <GitBranch className='w-5 h-5 mr-2 text-primary-500' />
          Repository Overview
        </h3>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
            <Star className='w-6 h-6 text-yellow-500 mx-auto mb-2' />
            <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              {formatNumber(stats.stars)}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-400'>Stars</div>
          </div>

          <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
            <GitBranch className='w-6 h-6 text-blue-500 mx-auto mb-2' />
            <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              {formatNumber(stats.forks)}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-400'>Forks</div>
          </div>

          <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
            <Eye className='w-6 h-6 text-green-500 mx-auto mb-2' />
            <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              {formatNumber(stats.watchers)}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-400'>Watchers</div>
          </div>

          <div className='text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
            <AlertCircle className='w-6 h-6 text-red-500 mx-auto mb-2' />
            <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
              {stats.openIssues}
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-400'>Open Issues</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded'>
            <span className='text-gray-600 dark:text-gray-400'>Language</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>
              {stats.language || 'Unknown'}
            </span>
          </div>

          <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded'>
            <span className='text-gray-600 dark:text-gray-400'>License</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>
              {stats.license?.name || 'No License'}
            </span>
          </div>

          <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded'>
            <span className='text-gray-600 dark:text-gray-400'>Created</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>
              {formatDate(stats.createdAt)}
            </span>
          </div>

          <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded'>
            <span className='text-gray-600 dark:text-gray-400'>Last Updated</span>
            <span className='font-medium text-gray-900 dark:text-gray-100'>
              {formatRelativeTime(stats.updatedAt)}
            </span>
          </div>
        </div>

        {/* Topics */}
        {stats.topics && stats.topics.length > 0 && (
          <div className='mt-6'>
            <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-3'>Topics</h4>
            <div className='flex flex-wrap gap-2'>
              {stats.topics.slice(0, 8).map((topic) => (
                <span
                  key={topic}
                  className='px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium'
                >
                  {topic}
                </span>
              ))}
              {stats.topics.length > 8 && (
                <span className='px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium'>
                  +{stats.topics.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Commits */}
      {commits.length > 0 && (
        <div className='card'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center'>
            <GitCommit className='w-5 h-5 mr-2 text-primary-500' />
            Recent Commits
          </h3>
          <div className='space-y-3'>
            {commits.map((commit) => (
              <div
                key={commit.sha}
                className='flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
              >
                <div className='flex-shrink-0'>
                  <GitCommit className='w-4 h-4 text-gray-400 mt-1' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>
                    {commit.message.split('\n')[0]}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {commit.author.name} • {formatRelativeTime(commit.author.date)}
                  </p>
                </div>
                <a
                  href={commit.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0'
                >
                  {commit.sha.substring(0, 7)}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contributors */}
      {contributors.length > 0 && (
        <div className='card'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center'>
            <Users className='w-5 h-5 mr-2 text-primary-500' />
            Top Contributors
          </h3>
          <div className='space-y-3'>
            {contributors.slice(0, 8).map((contributor) => (
              <div
                key={contributor.id}
                className='flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'
              >
                <img
                  src={contributor.avatar_url}
                  alt={contributor.login}
                  className='w-8 h-8 rounded-full'
                />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {contributor.login}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    {contributor.contributions} contributions
                  </p>
                </div>
                <a
                  href={contributor.html_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs text-primary-600 dark:text-primary-400 hover:underline'
                >
                  View Profile
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubStats;
