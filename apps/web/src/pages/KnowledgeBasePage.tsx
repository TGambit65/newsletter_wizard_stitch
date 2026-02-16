import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, KnowledgeSource, SourceType } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { KnowledgeBaseGridSkeleton } from '@/components/ui/Skeleton';
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
  File,
  Youtube,
  Rss,
  StickyNote,
  FileSpreadsheet,
  Presentation,
  Music,
  Video,
  FileCode,
  Link2,
  ChevronDown,
  Eye,
  MoreHorizontal,
  Check
} from 'lucide-react';
import clsx from 'clsx';

// Enhanced source type configuration - NotebookLM style
type SourceCategory = 'upload' | 'link' | 'write';
type ExtendedSourceType = 'url' | 'youtube' | 'rss' | 'gdrive' | 'pdf' | 'docx' | 'txt' | 'md' | 'pptx' | 'xlsx' | 'csv' | 'audio' | 'video' | 'text' | 'note';

interface SourceTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: SourceCategory;
  accept?: string;
  description: string;
  placeholder?: string;
}

const SOURCE_TYPES: Record<ExtendedSourceType, SourceTypeConfig> = {
  // Upload types
  pdf: { label: 'PDF Document', icon: FileText, category: 'upload', accept: '.pdf', description: 'Upload PDF files' },
  docx: { label: 'Word Document', icon: FileText, category: 'upload', accept: '.docx', description: 'Upload Word documents' },
  txt: { label: 'Text File', icon: FileText, category: 'upload', accept: '.txt', description: 'Upload plain text files' },
  md: { label: 'Markdown', icon: FileCode, category: 'upload', accept: '.md', description: 'Upload Markdown files' },
  pptx: { label: 'PowerPoint', icon: Presentation, category: 'upload', accept: '.pptx', description: 'Extract text from presentations' },
  xlsx: { label: 'Excel/CSV', icon: FileSpreadsheet, category: 'upload', accept: '.xlsx,.csv', description: 'Upload spreadsheets' },
  csv: { label: 'CSV Data', icon: FileSpreadsheet, category: 'upload', accept: '.csv', description: 'Upload CSV data files' },
  audio: { label: 'Audio File', icon: Music, category: 'upload', accept: '.mp3,.wav,.m4a', description: 'Upload audio (transcription needed)' },
  video: { label: 'Video File', icon: Video, category: 'upload', accept: '.mp4,.mov,.webm', description: 'Upload video (transcription needed)' },
  
  // Link types
  url: { label: 'Website', icon: Globe, category: 'link', description: 'Fetch content from any webpage', placeholder: 'https://example.com/article' },
  youtube: { label: 'YouTube Video', icon: Youtube, category: 'link', description: 'Extract transcript from YouTube', placeholder: 'https://youtube.com/watch?v=...' },
  rss: { label: 'RSS Feed', icon: Rss, category: 'link', description: 'Import articles from RSS/Atom feeds', placeholder: 'https://blog.example.com/feed.xml' },
  gdrive: { label: 'Google Drive', icon: Link2, category: 'link', description: 'Import from Google Docs/Sheets', placeholder: 'https://docs.google.com/...' },
  
  // Write types
  text: { label: 'Paste Text', icon: FileText, category: 'write', description: 'Paste content from clipboard' },
  note: { label: 'Quick Note', icon: StickyNote, category: 'write', description: 'Write notes and ideas' },
};

const CATEGORIES: { key: SourceCategory; label: string; types: ExtendedSourceType[] }[] = [
  { key: 'upload', label: 'Upload Files', types: ['pdf', 'docx', 'txt', 'md', 'pptx', 'xlsx', 'audio', 'video'] },
  { key: 'link', label: 'Add Link', types: ['url', 'youtube', 'rss', 'gdrive'] },
  { key: 'write', label: 'Write', types: ['text', 'note'] },
];

type SourceFilter = 'all' | 'url' | 'document' | 'manual' | 'youtube' | 'rss';

// Helper to detect URL type
function detectUrlType(url: string): ExtendedSourceType {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('docs.google.com') || url.includes('drive.google.com') || url.includes('sheets.google.com')) return 'gdrive';
  if (url.endsWith('.xml') || url.endsWith('/feed') || url.endsWith('/rss') || url.includes('/feed/')) return 'rss';
  return 'url';
}

// Helper to get file extension type
function getFileType(file: File): ExtendedSourceType {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, ExtendedSourceType> = {
    'pdf': 'pdf',
    'docx': 'docx',
    'doc': 'docx',
    'txt': 'txt',
    'md': 'md',
    'markdown': 'md',
    'pptx': 'pptx',
    'ppt': 'pptx',
    'xlsx': 'xlsx',
    'xls': 'xlsx',
    'csv': 'xlsx',
    'mp3': 'audio',
    'wav': 'audio',
    'm4a': 'audio',
    'mp4': 'video',
    'mov': 'video',
    'webm': 'video',
  };
  return typeMap[ext] || 'txt';
}

export function KnowledgeBasePage() {
  const { tenant } = useAuth();
  const toast = useToast();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SourceCategory>('upload');
  const [selectedType, setSelectedType] = useState<ExtendedSourceType>('pdf');
  
  // Form state
  const [urlInput, setUrlInput] = useState('');
  const [detectedUrlType, setDetectedUrlType] = useState<ExtendedSourceType>('url');
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [adding, setAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tenant) {
      loadSources();
    }
  }, [tenant]);

  // Auto-detect URL type as user types
  useEffect(() => {
    if (urlInput) {
      setDetectedUrlType(detectUrlType(urlInput));
    }
  }, [urlInput]);

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

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-primary-500', 'bg-primary-50');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-primary-500', 'bg-primary-50');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-primary-500', 'bg-primary-50');
    }
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      setSelectedCategory('upload');
    }
  }, []);

  async function addSource() {
    if (!tenant) return;
    setAdding(true);
    setUploadProgress('');

    try {
      // Handle file uploads
      if (selectedCategory === 'upload' && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgress(`Uploading ${file.name} (${i + 1}/${selectedFiles.length})...`);
          
          const reader = new FileReader();
          const fileData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const uploadResult = await api.uploadDocument({
            fileData,
            fileName: file.name,
            mimeType: file.type,
            tenant_id: tenant.id
          });

          if (uploadResult.success && uploadResult.source) {
            setUploadProgress(`Processing ${file.name}...`);
            
            // Process the uploaded document
            api.processSource({
              source_id: uploadResult.source.id,
              source_type: 'document' as SourceType,
              file_path: uploadResult.file_path
            }).catch(console.error);
          }
        }
        await loadSources();
      }
      // Handle URL-based sources
      else if (selectedCategory === 'link' && urlInput) {
        const sourceType = detectedUrlType === 'youtube' ? 'youtube' : 
                          detectedUrlType === 'rss' ? 'rss' :
                          detectedUrlType === 'gdrive' ? 'gdrive' : 'url';
        
        const newSource = {
          tenant_id: tenant.id,
          source_type: sourceType as SourceType,
          source_uri: urlInput,
          title: urlInput,
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
          setUploadProgress('Processing content...');
          
          api.processSource({
            source_id: data.id,
            source_type: sourceType as SourceType,
            url: urlInput
          }).then(loadSources).catch(() => loadSources());
        }
      }
      // Handle text/notes
      else if (selectedCategory === 'write' && contentInput) {
        const newSource = {
          tenant_id: tenant.id,
          source_type: 'manual' as SourceType,
          title: titleInput || 'Quick Note',
          description: contentInput.substring(0, 200),
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
            source_type: 'manual' as SourceType,
            content: contentInput
          }).then(loadSources).catch(() => loadSources());
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
    setUrlInput('');
    setTitleInput('');
    setContentInput('');
    setSelectedFiles([]);
    setUploadProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function deleteSource(id: string) {
    const sourceToDelete = sources.find(s => s.id === id);
    if (!sourceToDelete) return;
    
    // Optimistic delete
    setSources(sources.filter(s => s.id !== id));
    setSelectedSources(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    
    // Show undo toast
    toast.undoToast(
      `"${sourceToDelete.title}" deleted`,
      async () => {
        // Restore the source
        setSources(prev => [sourceToDelete, ...prev]);
        toast.success('Source restored');
      },
      10000
    );
    
    // Actually delete after delay (soft delete window)
    setTimeout(async () => {
      try {
        await supabase.from('knowledge_sources').delete().eq('id', id);
      } catch (error) {
        console.error('Error deleting source:', error);
        // Restore on error
        setSources(prev => [sourceToDelete, ...prev]);
        toast.error('Failed to delete source');
      }
    }, 10000);
  }

  async function bulkDelete() {
    if (selectedSources.size === 0) return;
    
    const sourcesToDelete = sources.filter(s => selectedSources.has(s.id));
    const count = sourcesToDelete.length;
    
    // Optimistic delete
    setSources(sources.filter(s => !selectedSources.has(s.id)));
    const deletedIds = new Set(selectedSources);
    setSelectedSources(new Set());
    
    // Show undo toast
    toast.undoToast(
      `${count} source${count > 1 ? 's' : ''} deleted`,
      async () => {
        // Restore all sources
        setSources(prev => [...sourcesToDelete, ...prev]);
        toast.success(`${count} source${count > 1 ? 's' : ''} restored`);
      },
      10000
    );
    
    // Actually delete after delay
    setTimeout(async () => {
      try {
        for (const id of deletedIds) {
          await supabase.from('knowledge_sources').delete().eq('id', id);
        }
      } catch (error) {
        console.error('Error bulk deleting:', error);
        setSources(prev => [...sourcesToDelete, ...prev]);
        toast.error('Failed to delete sources');
      }
    }, 10000);
  }

  async function reprocessSource(source: KnowledgeSource) {
    try {
      await supabase
        .from('knowledge_sources')
        .update({ status: 'pending' })
        .eq('id', source.id);
      
      api.processSource({
        source_id: source.id,
        source_type: source.source_type,
        url: source.source_uri || undefined
      }).then(loadSources).catch(loadSources);
      
      loadSources();
    } catch (error) {
      console.error('Error reprocessing:', error);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  const filteredSources = sources.filter(source => {
    if (filter === 'all') return true;
    if (filter === 'youtube') return source.source_type === 'youtube';
    if (filter === 'rss') return source.source_type === 'rss';
    if (filter === 'url') return source.source_type === 'url' || source.source_type === 'youtube' || source.source_type === 'rss' || source.source_type === 'gdrive';
    if (filter === 'document') return source.source_type === 'document';
    if (filter === 'manual') return source.source_type === 'manual';
    return true;
  }).filter(source => {
    if (!searchQuery) return true;
    return source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           source.source_uri?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filterButtons: { value: SourceFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: sources.length },
    { value: 'url', label: 'Links', count: sources.filter(s => ['url', 'youtube', 'rss', 'gdrive'].includes(s.source_type)).length },
    { value: 'document', label: 'Documents', count: sources.filter(s => s.source_type === 'document').length },
    { value: 'manual', label: 'Notes', count: sources.filter(s => s.source_type === 'manual').length },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-neutral-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSourceIcon = (sourceType: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      url: Globe,
      youtube: Youtube,
      rss: Rss,
      gdrive: Link2,
      document: File,
      manual: StickyNote,
    };
    const Icon = iconMap[sourceType] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const getSourceColor = (sourceType: string) => {
    const colorMap: Record<string, string> = {
      url: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      youtube: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      rss: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
      gdrive: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      document: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      manual: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    };
    return colorMap[sourceType] || 'text-neutral-500 bg-neutral-100 dark:bg-neutral-700';
  };

  const canSubmit = () => {
    if (adding) return false;
    if (selectedCategory === 'upload') return selectedFiles.length > 0;
    if (selectedCategory === 'link') return !!urlInput;
    if (selectedCategory === 'write') return !!contentInput;
    return false;
  };

  // Source detail view
  const selectedSourceDetail = showDetailModal ? sources.find(s => s.id === showDetailModal) : null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Knowledge Base</h1>
          <p className="text-neutral-500 mt-1">
            Add content sources to power your AI newsletter generation • {sources.length} sources, {sources.reduce((sum, s) => sum + (s.token_count || 0), 0).toLocaleString()} tokens
          </p>
        </div>
        <div className="flex gap-3">
          {selectedSources.size > 0 && (
            <button
              onClick={bulkDelete}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedSources.size})
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/25"
          >
            <Plus className="w-5 h-5" />
            Add Source
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources by title or URL..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={clsx(
                'px-4 py-2.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap',
                filter === btn.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              )}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <KnowledgeBaseGridSkeleton />
      ) : filteredSources.length === 0 ? (
        <div 
          className="bg-white dark:bg-neutral-800 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 p-12 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No sources yet</h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Add URLs, upload documents, paste text, or import from YouTube and RSS feeds to build your knowledge base
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-sm rounded-full">Websites</span>
            <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm rounded-full">YouTube</span>
            <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-sm rounded-full">PDF/DOCX</span>
            <span className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-sm rounded-full">RSS Feeds</span>
            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 text-sm rounded-full">Google Docs</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add your first source
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className={clsx(
                'group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-lg transition-all duration-200',
                selectedSources.has(source.id) && 'ring-2 ring-primary-500'
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Selection checkbox */}
                  <button
                    onClick={() => {
                      setSelectedSources(prev => {
                        const next = new Set(prev);
                        if (next.has(source.id)) {
                          next.delete(source.id);
                        } else {
                          next.add(source.id);
                        }
                        return next;
                      });
                    }}
                    className={clsx(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      selectedSources.has(source.id)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-neutral-300 dark:border-neutral-600 group-hover:border-primary-400'
                    )}
                  >
                    {selectedSources.has(source.id) && <Check className="w-3 h-3" />}
                  </button>
                  
                  {/* Source icon */}
                  <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', getSourceColor(source.source_type))}>
                    {getSourceIcon(source.source_type)}
                  </div>
                </div>
                
                {/* Status & Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(source.status)}
                    <span className={clsx(
                      'text-xs font-medium capitalize',
                      source.status === 'ready' ? 'text-green-600' :
                      source.status === 'processing' ? 'text-amber-600' :
                      source.status === 'error' ? 'text-red-600' : 'text-neutral-500'
                    )}>
                      {source.status}
                    </span>
                  </div>
                  
                  {/* Action menu */}
                  <div className="relative group/menu">
                    <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 z-10 hidden group-hover/menu:block">
                      <button
                        onClick={() => setShowDetailModal(source.id)}
                        className="w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => reprocessSource(source)}
                        className="w-full px-3 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reprocess
                      </button>
                      <button
                        onClick={() => deleteSource(source.id)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1.5 line-clamp-2">
                {source.title}
              </h3>
              
              {/* Source URI */}
              {source.source_uri && (
                <p className="text-sm text-neutral-500 truncate mb-3">{source.source_uri}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {source.chunk_count || 0} chunks
                </span>
                <span>{(source.token_count || 0).toLocaleString()} tokens</span>
              </div>
              
              {/* Error message */}
              {source.status === 'error' && source.error_message && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {source.error_message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Add Source</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Category Tabs */}
              <div className="flex gap-2 mb-6">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setSelectedType(cat.types[0]);
                    }}
                    className={clsx(
                      'flex-1 py-3 px-4 rounded-lg font-medium transition-colors text-sm',
                      selectedCategory === cat.key
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Upload Section */}
              {selectedCategory === 'upload' && (
                <div>
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary-400"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc,.txt,.md,.pptx,.ppt,.xlsx,.xls,.csv,.mp3,.wav,.m4a,.mp4,.mov,.webm"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Drop files here or click to browse
                    </p>
                    <p className="text-sm text-neutral-500">
                      PDF, DOCX, TXT, Markdown, PowerPoint, Excel, CSV, Audio, Video
                    </p>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-neutral-500" />
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">{file.name}</p>
                              <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(idx)}
                            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                          >
                            <X className="w-4 h-4 text-neutral-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Link Section */}
              {selectedCategory === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Enter URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com, youtube.com/watch?v=..., or RSS feed URL"
                        className="w-full px-4 py-3 pr-32 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      />
                      {urlInput && (
                        <span className={clsx(
                          'absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium',
                          getSourceColor(detectedUrlType)
                        )}>
                          {SOURCE_TYPES[detectedUrlType]?.label || 'Website'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick type buttons */}
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.find(c => c.key === 'link')?.types.map((type) => {
                      const config = SOURCE_TYPES[type];
                      const Icon = config.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            if (config.placeholder) {
                              setUrlInput(config.placeholder);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Write Section */}
              {selectedCategory === 'write' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      placeholder="My notes"
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Content
                    </label>
                    <textarea
                      value={contentInput}
                      onChange={(e) => setContentInput(e.target.value)}
                      placeholder="Paste your text or write your notes here..."
                      rows={8}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Progress */}
              {uploadProgress && (
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p className="text-sm text-primary-700 dark:text-primary-300 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {uploadProgress}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
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
                {adding ? 'Adding...' : `Add ${selectedCategory === 'upload' && selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'Source'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Source Detail Modal */}
      {showDetailModal && selectedSourceDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', getSourceColor(selectedSourceDetail.source_type))}>
                  {getSourceIcon(selectedSourceDetail.source_type)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{selectedSourceDetail.title}</h2>
                  <p className="text-sm text-neutral-500 capitalize">{selectedSourceDetail.source_type} source</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(null)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                  <p className="text-sm text-neutral-500 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedSourceDetail.status)}
                    <span className="font-medium capitalize">{selectedSourceDetail.status}</span>
                  </div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                  <p className="text-sm text-neutral-500 mb-1">Chunks</p>
                  <p className="font-medium">{selectedSourceDetail.chunk_count || 0} chunks</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                  <p className="text-sm text-neutral-500 mb-1">Tokens</p>
                  <p className="font-medium">{(selectedSourceDetail.token_count || 0).toLocaleString()}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
                  <p className="text-sm text-neutral-500 mb-1">Added</p>
                  <p className="font-medium">{new Date(selectedSourceDetail.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* URL */}
              {selectedSourceDetail.source_uri && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Source URL</p>
                  <a
                    href={selectedSourceDetail.source_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:underline break-all"
                  >
                    {selectedSourceDetail.source_uri}
                  </a>
                </div>
              )}
              
              {/* Description/Content Preview */}
              {selectedSourceDetail.description && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Content Preview</p>
                  <p className="text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg">
                    {selectedSourceDetail.description}
                  </p>
                </div>
              )}
              
              {/* Error message */}
              {selectedSourceDetail.error_message && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Error</p>
                  <p className="text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    {selectedSourceDetail.error_message}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-6 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => {
                  reprocessSource(selectedSourceDetail);
                  setShowDetailModal(null);
                }}
                className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reprocess
              </button>
              <button
                onClick={() => {
                  deleteSource(selectedSourceDetail.id);
                  setShowDetailModal(null);
                }}
                className="flex-1 py-3 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
