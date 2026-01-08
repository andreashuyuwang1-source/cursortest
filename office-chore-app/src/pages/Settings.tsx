import { useState } from 'react'
import { Download, Upload, Trash2, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Divider, Field, TextArea } from '../components/ui/Field'

export function SettingsPage({
  exportJson,
  onImportJson,
  onClearAll,
  onLoadDemo,
}: {
  exportJson: () => string
  onImportJson: (raw: string) => void
  onClearAll: () => void
  onLoadDemo: () => void
}) {
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [copied, setCopied] = useState(false)

  const download = () => {
    const contents = exportJson()
    const blob = new Blob([contents], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'office-chore-app-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-base font-semibold text-slate-900">Settings</div>
        <div className="mt-1 text-sm text-slate-600">Backup and restore your local data.</div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={download}>
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              setError(undefined)
              setCopied(false)
              try {
                await navigator.clipboard.writeText(exportJson())
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1500)
              } catch {
                setError('Could not copy to clipboard in this browser. Use Export JSON instead.')
              }
            }}
          >
            Copy to clipboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onLoadDemo()
            }}
          >
            <Sparkles className="h-4 w-4" />
            Load demo data
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!confirm('Clear all local data? This cannot be undone.')) return
              onClearAll()
            }}
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        </div>

        <Divider label="Import" />

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setError(undefined)
            setCopied(false)
            try {
              onImportJson(raw)
              setRaw('')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Import failed')
            }
          }}
        >
          <Field label="Paste JSON export">
            <TextArea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste the JSON you previously exported."
              className="min-h-40 font-mono"
            />
          </Field>
          {error ? <div className="text-sm text-rose-700">{error}</div> : null}
          {copied ? <div className="text-sm text-emerald-700">Copied.</div> : null}
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" disabled={!raw.trim()}>
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

