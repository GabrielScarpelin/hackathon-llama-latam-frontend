// src/types/CollectionTypes.ts

export interface Palavra {
    id: string;
    tipo: string;
    texto_pt: string;
    texto_en: string;
    created_at: string;
    url?: string;
  }
  
  export interface Frase {
    id: string;
    tipo: string;
    texto_pt: string;
    texto_en: string;
    created_at: string;
    url?: string;
  }
  
  export interface Collection {
    collection_id: string;
    title: string;
    topic: string;
    created_at: string;
    words: Palavra[];
    sentences: Frase[];
  }
  