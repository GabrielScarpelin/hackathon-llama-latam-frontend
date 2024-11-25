"use client";

import { Collection } from "@/types/CollectionTypes";
import { createContext, ReactNode, useContext, useState } from "react";


interface CollectionContextType {
    collection: Collection | null;
    setCollection: React.Dispatch<React.SetStateAction<Collection | null>>;
  }
  

const CollectionContext = createContext<CollectionContextType>({
    collection: null,
    setCollection: () => null,
});

export function useCollection() {
    return useContext(CollectionContext);
}

export function CollectionProvider({ children }: { children: ReactNode }) {
    const [collection, setCollection] = useState<Collection | null>(null);

    return (
        <CollectionContext.Provider value={{ collection, setCollection }}>
            {children}
        </CollectionContext.Provider>
    );
}