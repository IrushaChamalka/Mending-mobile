import type { JSX } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { TextField, type TextFieldProps } from './TextField';

export interface FormTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> extends Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'> {
  /** From useForm. A form whose zod schema transforms its values passes the output type too. */
  control: Control<TFieldValues, unknown, TTransformedValues>;
  name: TName;
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

/** TextField wired to react-hook-form; shows the field's validation message as its error. */
export function FormTextField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  ...rest
}: FormTextFieldProps<TFieldValues, TName, TTransformedValues>): JSX.Element {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          ref={field.ref}
          value={toText(field.value)}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
          {...rest}
        />
      )}
    />
  );
}
