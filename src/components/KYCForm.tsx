import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { kycService } from '../services/kycService';
import { useToast } from '../hooks/useToast';

export const KYCForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('O arquivo deve ter no máximo 5MB', 'error');
        return;
      }
      setDocument(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) {
      showToast('Por favor, selecione um documento', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('documentNumber', documentNumber);
      formData.append('document', document);

      await kycService.submitKyc(formData);
      showToast('Documentos enviados com sucesso!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      showToast(error.message || 'Erro ao enviar documentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Verificação de Identidade (KYC)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Documento
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Selecione um tipo</option>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
            <option value="rg">RG</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número do Documento
          </label>
          <input
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documento
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleDocumentChange}
            className="w-full p-2 border rounded-md"
            required
          />
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Preview"
                className="max-w-xs rounded-md shadow-md"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Enviando...' : 'Enviar Documentos'}
        </button>
      </form>
    </div>
  );
}; 