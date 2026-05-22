'use client'

import { Label } from '@/components/ui/label'
import { ELIGIBILITY_FLAGS, type EligibilityValues } from './types'

type EligibilityAttributesProps = {
  values: EligibilityValues
  onChange: (values: EligibilityValues) => void
}

export function EligibilityAttributes({
  values,
  onChange,
}: EligibilityAttributesProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium text-muted-foreground">
        Eligibility Attributes
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {ELIGIBILITY_FLAGS.map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              className="size-4 rounded border-input"
              checked={values[key]}
              onChange={(e) =>
                onChange({ ...values, [key]: e.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  )
}
