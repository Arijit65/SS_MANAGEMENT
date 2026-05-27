import { useAppSelector, useAppDispatch } from "../../store/hooks"
import { fetchFiles, deleteFile, type ProjectFile as ProjectFileType } from "../../store/slices/projectSlice"
import { showSuccessToast, showErrorToast } from "../../store/slices/toastSlice"
import { formatDistanceToNow } from "date-fns"
import {
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Download,
  Trash2,
  MoreHorizontal,
  FolderOpen,
} from "lucide-react"
import { useState } from "react"

interface ProjectFilesProps {
  projectId: string
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  archive: <Archive className="h-5 w-5" />,
  other: <File className="h-5 w-5" />,
}

const FILE_COLORS: Record<string, string> = {
  document: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  image: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  video: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  audio: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  archive: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export default function ProjectFiles({ projectId }: ProjectFilesProps) {
  const dispatch = useAppDispatch()
  const { files, filesLoading } = useAppSelector((state) => state.projects)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return
    try {
      await dispatch(deleteFile(fileId)).unwrap()
      dispatch(showSuccessToast("File deleted"))
    } catch (error) {
      dispatch(showErrorToast("Failed to delete file"))
    }
    setOpenDropdown(null)
  }

  if (filesLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-[#0F0F12] p-4 rounded-lg border border-gray-200 dark:border-[#1F1F23] animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-[#2A2A2E] rounded mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-[#2A2A2E] rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-[#2A2A2E] rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1F1F23] rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No files yet</h3>
        <p className="text-gray-500 mt-1">Upload files to share with your team</p>
        <button className="mt-4 px-4 py-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1890D8] transition-colors text-sm font-medium inline-flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Files
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{files.length} files</span>
        <button className="px-3 py-1.5 text-sm text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-lg transition-colors flex items-center gap-1">
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="bg-white dark:bg-[#0F0F12] p-4 rounded-lg border border-gray-200 dark:border-[#1F1F23] hover:shadow-md hover:border-[#1DA1F2]/30 transition-all group"
          >
            {/* Preview or Icon */}
            {file.fileType === "image" && file.thumbnailUrl ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1F1F23] mb-3">
                <img
                  src={file.thumbnailUrl || file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-lg ${FILE_COLORS[file.fileType]} flex items-center justify-center mb-3`}>
                {FILE_ICONS[file.fileType] || FILE_ICONS.other}
              </div>
            )}

            {/* File Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate" title={file.originalName}>
                  {file.originalName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(file.size)} • {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                </p>
                {file.uploader && (
                  <p className="text-xs text-gray-400 mt-1">
                    by {file.uploader.fullName}
                  </p>
                )}
              </div>
              
              {/* Actions */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === file.id ? null : file.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openDropdown === file.id && (
                  <div className="absolute right-0 z-10 mt-1 w-36 bg-white dark:bg-[#1F1F23] rounded-lg shadow-lg border border-gray-200 dark:border-[#2A2A2E] py-1">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E] text-gray-700 dark:text-gray-300"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenDropdown(null)} />
      )}
    </div>
  )
}
