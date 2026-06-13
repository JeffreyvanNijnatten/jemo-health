import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderOpen, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import JSZip from 'jszip'
import { api } from '../lib/api'

interface UploadResult {
  profiles: { slot_id: number; added: number; skipped: number }[]
  total_added: number
  total_skipped: number
}

interface Props {
  onUploaded: () => void
}

async function processEntry(entry: FileSystemEntry, zip: JSZip, path = ''): Promise<void> {
  if (entry.isFile) {
    await new Promise<void>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(async (file) => {
        const fullPath = path ? `${path}/${file.name}` : file.name
        zip.file(fullPath, await file.arrayBuffer())
        resolve()
      }, reject)
    })
  } else if (entry.isDirectory) {
    const dirPath = path ? `${path}/${entry.name}` : entry.name
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    // readEntries returns max 100 per call — loop until empty
    const allEntries: FileSystemEntry[] = []
    await new Promise<void>((resolve, reject) => {
      const readBatch = () => {
        reader.readEntries((batch) => {
          if (batch.length === 0) { resolve(); return }
          allEntries.push(...batch)
          readBatch()
        }, reject)
      }
      readBatch()
    })
    for (const e of allEntries) await processEntry(e, zip, dirPath)
  }
}

async function entriesToZip(entries: FileSystemEntry[]): Promise<File> {
  const zip = new JSZip()
  for (const entry of entries) await processEntry(entry, zip)
  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], 'tanita_upload.zip', { type: 'application/zip' })
}

async function fileListToZip(files: FileList): Promise<File> {
  const zip = new JSZip()
  for (const file of Array.from(files)) {
    zip.file(file.webkitRelativePath || file.name, await file.arrayBuffer())
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], 'tanita_upload.zip', { type: 'application/zip' })
}

export function UploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (zipFile: File) => {
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      const res = await api.upload(zipFile)
      setResult(res)
      onUploaded()
    } catch (e: any) {
      setError(e.message || 'Something went wrong with the upload.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    // Extract entries synchronously — DataTransferItemList is cleared after event returns
    const entries: FileSystemEntry[] = []
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const entry = e.dataTransfer.items[i].webkitGetAsEntry()
      if (entry) entries.push(entry)
    }
    if (entries.length) entriesToZip(entries).then(upload)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) fileListToZip(e.target.files).then(upload)
  }

  return (
    <div className="w-full">
      <motion.div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && !result && inputRef.current?.click()}
        animate={{ borderColor: dragging ? '#c094e4' : '#e8e2db' }}
        className="relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors hover:border-[#c094e4] bg-white"
      >
        <input
          ref={inputRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          multiple
          onChange={onInputChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                <RefreshCw size={22} className="text-[#c094e4]" />
              </motion.div>
              <p className="text-sm text-[#9a9490]">Reading your data…</p>
            </motion.div>
          ) : result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <CheckCircle size={22} className="text-[#a8e6cf]" />
              <p className="text-sm font-medium text-[#222]">
                {result.total_added > 0
                  ? `${result.total_added} new measurement${result.total_added !== 1 ? 's' : ''} added`
                  : 'Already up to date — nothing new found'}
              </p>
              {result.total_skipped > 0 && (
                <p className="text-xs text-[#9a9490]">
                  {result.total_skipped} already in your history, skipped
                </p>
              )}
              <button
                onClick={e => { e.stopPropagation(); setResult(null) }}
                className="mt-1 text-xs text-[#c094e4] hover:underline"
              >
                Upload again
              </button>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <AlertCircle size={22} className="text-[#e8748a]" />
              <p className="text-sm text-[#be5178]">{error}</p>
              <button onClick={e => { e.stopPropagation(); setError(null) }} className="text-xs text-[#9a9490] hover:underline">
                Try again
              </button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <FolderOpen size={22} className="text-[#c8bfb6]" />
              <p className="text-sm text-[#9a9490]">
                Drop your <span className="font-medium text-[#222]">TANITA</span> folder here, or click to browse
              </p>
              <p className="text-xs text-[#c0b8b0]">Duplicates are automatically skipped</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
