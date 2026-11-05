import { useI18n } from '../../i18n';
import { useState, useCallback, useEffect, useRef, useId } from 'react';
import { ChevronDownIcon, CheckIcon } from '../icons/Icons';
import './Dropdown.css';

interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const Dropdown = ({ label, options, selectedId, onSelect, placeholder, disabled = false }: DropdownProps) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const valueId = useId();
  const menuId = useId();

  const selectedOption = options.find(option => option.id === selectedId);
  const hasSelection = !!selectedOption;
  const displayLabel = selectedOption?.label ?? placeholder ?? options[0]?.label ?? '';

  const handleToggle = useCallback((): void => {
    if (disabled) return;
    setIsOpen(previousState => !previousState);
  }, [disabled]);

  const handleOptionSelect = useCallback((optionId: string): void => {
    onSelect(optionId);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onSelect]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || disabled) return;
    event.preventDefault();
    if (!isOpen) {
      setIsOpen(true);
      return;
    }
    const items = [...(dropdownRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    if (items.length === 0) return;
    const current = items.findIndex(item => item === document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }, [disabled, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const items = [...(dropdownRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    const selected = items.find(item => item.getAttribute('aria-selected') === 'true');
    (selected ?? items[0])?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      className="dropdown"
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <span id={labelId} className="dropdown-label">{t(label)}</span>
      <button
        ref={triggerRef}
        className={`dropdown-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${!hasSelection ? 'placeholder' : ''}`}
        onClick={handleToggle}
        type="button"
        disabled={disabled}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
      >
        <span id={valueId} className="dropdown-trigger-text">{t(displayLabel)}</span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <div id={menuId} className="dropdown-menu" role="listbox" aria-labelledby={labelId}>
          {options.map((option) => (
            <button
              key={option.id}
              className={`dropdown-option ${option.id === selectedId ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(option.id)}
              type="button"
              role="option"
              aria-selected={option.id === selectedId}
            >
              <span className="dropdown-option-text">{t(option.label)}</span>
              {option.id === selectedId && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
