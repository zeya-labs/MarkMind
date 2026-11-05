import { t } from '../../i18n';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { EMPTY_SERVICE, getServiceCredentialKeys, isServiceConfigured, type ServiceConfig } from '../../config/services';
import { type StatusType } from '../../types/common';
import {
  type ApiKeyPanelStatusMessage,
  type UseApiKeyPanelProps,
} from './types';
import {
  createHandleApiKeySave,
  createHandleApiKeyRemove,
  createHandleServiceChange,
  createHandlePanelClose,
} from './handlers';

export const useApiKeyPanel = ({ isOpen, canClose, onClose }: UseApiKeyPanelProps) => {
  const [currentService, setCurrentService] = useState<ServiceConfig>(EMPTY_SERVICE);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [status, setStatus] = useState<ApiKeyPanelStatusMessage>({
    message: '',
    type: null,
    showGoToApp: false,
  });
  const canClosePanel = canClose;
  const [buttonError, setButtonError] = useState('');
  const buttonErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modelsRefreshTrigger, setModelsRefreshTrigger] = useState(0);

  const checkExistingApiKey = useCallback(async (service: ServiceConfig): Promise<boolean> => {
    const result = await chrome.storage.local.get(getServiceCredentialKeys(service));
    const keyExists = isServiceConfigured(service, result);
    setHasExistingKey(keyExists);
    return keyExists;
  }, []);

  const showStatusMessage = useCallback((message: string, type: StatusType): void => {
    setStatus({ message, type, showGoToApp: false });
  }, []);

  const clearStatus = useCallback((): void => {
    setStatus({ message: '', type: null, showGoToApp: false });
  }, []);

  const handlePanelClose = useMemo(
    () => createHandlePanelClose({ canClosePanel, clearStatus, onClose }),
    [canClosePanel, clearStatus, onClose]
  );

  const handleServiceChange = useMemo(
    () => createHandleServiceChange({
      setCurrentService,
      setApiKeyInput,
      clearStatus,
      checkExistingApiKey,
      setSelectedModel,
    }),
    [clearStatus, checkExistingApiKey]
  );

  const handleModelChange = useCallback((modelId: string): void => {
    setSelectedModel(modelId);
  }, []);

  const showButtonError = useCallback((message: string): void => {
    if (buttonErrorTimeoutRef.current) {
      clearTimeout(buttonErrorTimeoutRef.current);
    }
    setButtonError(message);
    buttonErrorTimeoutRef.current = setTimeout(() => {
      setButtonError('');
      buttonErrorTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleStartEditingKey = useCallback((): void => {
    setIsEditingKey(true);
    clearStatus();
  }, [clearStatus]);

  const handleCancelEditing = useCallback((): void => {
    setIsEditingKey(false);
    setApiKeyInput('');
    setButtonError('');
    clearStatus();
  }, [clearStatus]);

  const handleModelsLoaded = useCallback((): void => {
    setModelsRefreshTrigger((previous) => previous + 1);
  }, []);

  const handleApiKeySave = useMemo(
    () => createHandleApiKeySave({
      currentService,
      apiKeyInput,
      baseUrlInput,
      setHasExistingKey,
      setApiKeyInput,
      showStatusMessage,
      showButtonError,
      setStatus,
      setIsEditingKey,
      onModelsLoaded: handleModelsLoaded,
    }),
    [currentService, apiKeyInput, baseUrlInput, showStatusMessage, showButtonError, handleModelsLoaded]
  );

  const handleApiKeyRemove = useMemo(
    () => createHandleApiKeyRemove({
      currentService,
      setHasExistingKey,
      setApiKeyInput,
      showStatusMessage,
      onClose,
    }),
    [currentService, showStatusMessage, onClose]
  );

  const handleApiKeyInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setApiKeyInput(event.target.value);
    },
    []
  );

  const handleBaseUrlInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setBaseUrlInput(event.target.value);
    },
    []
  );

  const handleApiKeyInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Enter') {
        handleApiKeySave();
      }
    },
    [handleApiKeySave]
  );

  const handleOverlayClick = useCallback((): void => {
    if (canClosePanel) {
      handlePanelClose();
    }
  }, [canClosePanel, handlePanelClose]);

  const handleGoToApp = useCallback((): void => {
    clearStatus();
    onClose?.();
  }, [clearStatus, onClose]);

  useEffect(() => {
    return () => {
      if (buttonErrorTimeoutRef.current) {
        clearTimeout(buttonErrorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkExistingApiKey(currentService);
    }
  }, [isOpen, currentService, checkExistingApiKey]);

  useEffect(() => {
    if (currentService.baseUrlStorageKey) {
      chrome.storage.local.get([currentService.baseUrlStorageKey]).then(result => {
        setBaseUrlInput(result[currentService.baseUrlStorageKey!] || '');
      });
    } else {
      setBaseUrlInput('');
    }
  }, [currentService]);

  return {
    currentService,
    apiKeyInput,
    baseUrlInput,
    selectedModel,
    modelsRefreshTrigger,
    hasExistingKey,
    isEditingKey,
    status: { ...status, message: t(status.message) },
    buttonError: t(buttonError),
    canClosePanel,
    handleServiceChange,
    handleModelChange,
    handleApiKeyInputChange,
    handleBaseUrlInputChange,
    handleApiKeySave,
    handleApiKeyInputKeyDown,
    handleApiKeyRemove,
    handleStartEditingKey,
    handleCancelEditing,
    handleOverlayClick,
    handleGoToApp,
    handlePanelClose,
  };
};
