import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, KnowledgeSource, SourceType } from '@/lib/supabase';
import { api } from '@/lib/api';
import { 
  Plus, 
  Globe, 
  FileText, 
  Trash2, 
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Upload,
  File
} from 'lucide-react';
import clsx from 'clsx';

type SourceFilter = 'all' | 'url' | 'document' | 'manual';
type AddSourceType = 'url' | 'text' | 'document';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT'
};

export function KnowledgeBasePage() {
  const { tenant } = useAuth();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<AddSourceType>('url');
  const [addUrl, setAddUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addContent, setAddContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenant) {
      loadSources();
    }
  }, [tenant]);

  async function loadSources() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('tenant_id', tenant!.id)
        .order('created_at', { ascending: false });
      
      setSources(data || []);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addSource() {
    if (!tenant) return;
    setAdding(true);
    setUploadProgress('');

    try {
      if (addType === 'document' && selectedFile) {
        // Handle document upload
        setUploadProgress('Reading file...');
        
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        setUploadProgress('Uploading document...');
        
        const uploadResult = await api.uploadDocument({
          fileData,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          tenant_id: tenant.id
        });

        if (uploadResult.success && uploadResult.source) {
          setSources([uploadResult.source as unknown as KnowledgeSource, ...sources]);
          
          setUploadProgress('Processing content...');
          
          // Process the uploaded document
          api.processSource({
            source_id: uploadResult.source.id,
            source_type: 'document' as SourceType,
            file_path: uploadResult.file_path
          }).then(() => {
            loadSources();
          }).catch((err) => {
            console.error('Processing error:', err);
            loadSources();
          });
        }
      } else {
        // Handle URL or manual text
        const sourceType: SourceType = addType === 'url' ? 'url' : 'manual';
        const newSource = {
          tenant_id: tenant.id,
          source_type: sourceType,
          source_uri: addType === 'url' ? addUrl : null,
          title: addType === 'url' ? addUrl : addTitle,
          description: addType === 'text' ? addContent.substring(0, 200) : null,
          status: 'pending'
        };

        const { data, error } = await supabase
          .from('knowledge_sources')
          .insert(newSource)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setSources([data, ...sources]);
          
          api.processSource({
            source_id: data.id,
            source_type: sourceType,
            url: addType === 'url' ? addUrl : undefined,
            content: addType === 'text' ? addContent : undefined
          }).then(() => {
            loadSources();
          }).catch(() => {
            loadSources();
          });
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error adding source:', error);
      setUploadProgress('Error: ' + (error as Error).message);
    } finally {
      setAdding(false);
    }
  }

  function closeModal() {
    setShowAddModal(false);
    setAddUrl('');
    setAddTitle('');
    setAddContent('');
    setSelectedFile(null);
    setUploadProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function deleteSource(id: string) {
    if (!confirm('Are you sure you want to delete this source?')) return;
    
    try {
      await supabase.from('knowledge_sources').delete().eq('id', id);
      setSources(sources.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert('Please select a PDF, DOCX, or TXT file.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB.');
        return;
      }
      setSelectedFile(file);
    }
  }

  const filteredSources = sources.filter(source => {
    if (filter !== 'all' && source.source_type !== filter) return false;
    if (searchQuery && !source.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filterButtons: { value: SourceFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'url', label: 'URLs' },
    { value: 'document', label: 'Documents' },
    { value: 'manual', label: 'Manual' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-warning animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-neutral-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error" />;
      default:
        return null;
    }
  };

  const getSourceIcon = (sourceType: SourceType) => {
    switch (sourceType) {
      case 'url':
        return <Globe className="w-5 h-5 text-primary-500" />;
      case 'document':
        return <File className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-neutral-500" />;
    }
  };

  const canSubmit = () => {
    if (adding) return false;
    if (addType === 'url') return !!addUrl;
    if (addType === 'text') return !!addTitle && !!addContent;
    if (addType === 'document') return !!selectedFile;
    return false;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Knowledge Base</h1>
          <p className="text-neutral-500 mt-1">Manage your content sources for AI-powered newsletter generation</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Source
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={clsx(
                'px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
                filter === btn.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No sources yet</h3>
          <p className="text-neutral-500 mb-6">Add URLs, documents, or text content to build your knowledge base</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add your first source
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    source.source_type === 'url' ? 'bg-primary-50 dark:bg-primary-900/20' :
                    source.source_type === 'document' ? 'bg-orange-50 dark:bg-orange-900/20' :
                    'bg-neutral-100 dark:bg-neutral-700'
                  )}>
                    {getSourceIcon(source.source_type)}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(source.status)}
                    <span className={clsx(
                      'text-xs font-medium capitalize',
                      source.status === 'ready' ? 'text-success' :
                      source.status === 'processing' ? 'text-warning' :
                      source.status === 'error' ? 'text-error' : 'text-neutral-500'
                    )}>
                      {source.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteSource(source.id)}
                  className="p-1.5 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 truncate">
                {source.title}
              </h3>
              {source.source_uri && (
                <p className="text-sm text-neutral-500 truncate mb-4">{source.source_uri}</p>
              )}
              {source.original_filename && (
                <p className="text-sm text-neutral-500 truncate mb-4">{source.original_filename}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span>{source.chunk_count || 0} chunks</span>
                <span>{(source.token_count || 0).toLocaleString()} tokens</span>
                {source.file_size_bytes && (
                  <span>{(source.file_size_bytes / 1024).toFixed(1)} KB</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Add Source</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Type Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setAddType('url')}
                  className={clsx(
                    'flex-1 py-3 rounded-lg font-medium transition-colors text-sm',
                    addType === 'url'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  )}
                >
                  <Globe className="w-4 h-4 inline mr-1.5" />
                  URL
                </button>
                <button
                  onClick={() => setAddType('document')}
                  className={clsx(
                    'flex-1 py-3 rounded-lg font-medium transition-colors text-sm',
                    addType === 'document'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  )}
                >
                  <Upload className="w-4 h-4 inline mr-1.5" />
                  Document
                </button>
                <button
                  onClick={() => setAddType('text')}
                  className={clsx(
                    'flex-1 py-3 rounded-lg font-medium transition-colors text-sm',
                    addType === 'text'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  )}
                >
                  <FileText className="w-4 h-4 inline mr-1.5" />
                  Text
                </button>
              </div>

              {addType === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              )}

              {addType === 'document' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Upload Document
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                      'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                      selectedFile
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <File className="w-10 h-10 text-primary-500" />
                        <p className="font-medium text-neutral-900 dark:text-white">{selectedFile.name}</p>
                        <p className="text-sm text-neutral-500">
                          {FILE_TYPE_LABELS[selectedFile.type] || 'Document'} - {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-neutral-400" />
                        <p className="font-medium text-neutral-700 dark:text-neutral-300">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-neutral-500">PDF, DOCX, or TXT (max 50MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {addType === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      placeholder="My content"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Content
                    </label>
                    <textarea
                      value={addContent}
                      onChange={(e) => setAddContent(e.target.value)}
                      placeholder="Paste your text content here..."
                      rows={6}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {uploadProgress && (
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p className="text-sm text-primary-700 dark:text-primary-300">{uploadProgress}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSource}
                disabled={!canSubmit()}
                className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
