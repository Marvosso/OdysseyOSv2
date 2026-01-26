/**
 * Date Serialization Utilities
 * 
 * Handles safe serialization and deserialization of Date objects
 * Prevents timezone-related bugs and ensures consistent date handling
 */

/**
 * Date marker for serialization
 */
interface SerializedDate {
  __type: 'Date';
  __value: string; // ISO 8601 string
}

/**
 * Check if a value is a Date object
 */
function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if a value is a serialized date
 */
function isSerializedDate(value: unknown): value is SerializedDate {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__type' in value &&
    '__value' in value &&
    (value as any).__type === 'Date' &&
    typeof (value as any).__value === 'string'
  );
}

/**
 * Serialize Date objects to a format that can be safely deserialized
 * 
 * Usage:
 * ```typescript
 * const serialized = JSON.stringify(data, dateSerializer);
 * ```
 */
export function dateSerializer(key: string, value: unknown): unknown {
  if (isDate(value)) {
    return {
      __type: 'Date',
      __value: value.toISOString(), // Always use UTC ISO string
    } as SerializedDate;
  }
  return value;
}

/**
 * Deserialize Date objects from serialized format
 * 
 * Usage:
 * ```typescript
 * const deserialized = JSON.parse(json, dateDeserializer);
 * ```
 */
export function dateDeserializer(key: string, value: unknown): unknown {
  if (isSerializedDate(value)) {
    const date = new Date(value.__value);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${value.__value}`);
      return value; // Return as-is if invalid
    }
    return date;
  }
  return value;
}

/**
 * Serialize data with Date handling
 * 
 * @param data Data to serialize
 * @returns JSON string with dates properly serialized
 */
export function serializeWithDates<T>(data: T): string {
  return JSON.stringify(data, dateSerializer);
}

/**
 * Deserialize data with Date handling
 * 
 * @param json JSON string to deserialize
 * @returns Deserialized data with Date objects restored
 */
export function deserializeWithDates<T>(json: string): T {
  return JSON.parse(json, dateDeserializer) as T;
}

/**
 * Deep clone an object with proper Date handling
 * 
 * @param obj Object to clone
 * @returns Cloned object with Date objects preserved
 */
export function cloneWithDates<T>(obj: T): T {
  return deserializeWithDates<T>(serializeWithDates(obj));
}

/**
 * Normalize a date value to a Date object
 * Handles Date objects, ISO strings, and timestamps
 * 
 * @param value Date value (Date, string, or number)
 * @returns Date object or null if invalid
 */
export function normalizeDate(value: unknown): Date | null {
  if (isDate(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

/**
 * Ensure all dates in an object are Date objects
 * Recursively processes objects and arrays
 * 
 * @param obj Object to process
 * @param dateFields Fields that should be dates (optional, auto-detects if not provided)
 * @returns Object with dates normalized
 */
export function normalizeDatesInObject<T>(
  obj: T,
  dateFields?: string[]
): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (isDate(obj)) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => normalizeDatesInObject(item, dateFields)) as T;
  }

  if (typeof obj === 'object') {
    const normalized = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      const shouldBeDate =
        dateFields?.includes(key) ||
        key.toLowerCase().endsWith('at') ||
        key.toLowerCase().endsWith('date') ||
        key.toLowerCase().endsWith('time') ||
        key.toLowerCase() === 'timestamp';

      if (shouldBeDate) {
        const normalizedDate = normalizeDate(value);
        (normalized as any)[key] = normalizedDate ?? value;
      } else if (typeof value === 'object' && value !== null) {
        (normalized as any)[key] = normalizeDatesInObject(value, dateFields);
      } else {
        (normalized as any)[key] = value;
      }
    }
    return normalized;
  }

  return obj;
}

/**
 * Get current date in UTC (timezone-safe)
 * 
 * @returns Current date as Date object
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Format date for display (timezone-aware)
 * 
 * @param date Date to format
 * @param locale Locale string (default: 'en-US')
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = normalizeDate(date);
  if (!dateObj) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...options,
  }).format(dateObj);
}

/**
 * Compare two dates (timezone-safe)
 * 
 * @param date1 First date
 * @param date2 Second date
 * @returns Negative if date1 < date2, 0 if equal, positive if date1 > date2
 */
export function compareDates(
  date1: Date | string | number,
  date2: Date | string | number
): number {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);

  if (!d1 || !d2) {
    return 0;
  }

  return d1.getTime() - d2.getTime();
}

/**
 * Check if a date string is valid ISO 8601
 * 
 * @param dateString Date string to validate
 * @returns True if valid ISO 8601
 */
export function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes('T') && dateString.includes('Z');
}
