"use client";

import { CollectionProvider, useCollection } from "@/contexts/ContentContext";
import { Collection } from "@/types/CollectionTypes";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const collectionContext = useCollection();
    const router = useRouter();

    const userId = "yanoma"
    const collectionId = params.id;
    const handleGetCollection = async (collectionId: string) => {
        if (collectionId) {
            const response = await fetch(`http://localhost:8000/content/collection/${userId}/${collectionId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            if (!response.ok) {
                throw new Error("Failed to fetch collection");
            }
            const data = await response.json();
            return data;
        }
    }
    useEffect(() => {
        if (collectionId) {
            handleGetCollection(collectionId as string).then((collection) => {
                const collectionData = collection as Collection;

                console.log(collectionData);
                collectionContext.setCollection(collectionData);
            }).catch(() => {
                console.error("Failed to fetch collection");
                router.push("/pages/home");
            })
        }
    }, [collectionId]);



    return <div className="h-full w-full">
        {children}
    </div>
}