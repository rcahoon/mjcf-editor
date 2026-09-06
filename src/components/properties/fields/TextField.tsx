import { useEffect, useState } from 'react'

interface TextFieldProps {
  label: string
  value: string
  onCommit: (value: string) => void
  placeholder?: string
}

export function TextField({ label, value, onCommit, placeholder }: TextFieldProps) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-neutral-400">{label}</span>
      <input
        type="text"
        className="w-32 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-neutral-100 focus:border-sky-500 focus:outline-none"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onCommit(text)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </label>
  )
}
