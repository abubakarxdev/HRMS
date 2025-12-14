import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { apiClient as api } from "../api/client";

interface Office {
    id: string;
    name: string;
    legalEntityId: string;
}

interface OfficeContextType {
    currentOffice: Office | null;
    currentOfficeId: string | undefined;
    setCurrentOffice: (office: Office | null) => void;
    offices: Office[];
    isLoading: boolean;
}

const OfficeContext = createContext<OfficeContextType | undefined>(undefined);

export const OfficeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentOffice, setCurrentOfficeState] = useState<Office | null>(null);

    // Fetch all offices
    const { data: offices = [], isLoading } = useQuery({
        queryKey: ["offices"],
        queryFn: async () => {
            const response = await api.get("/offices");
            return response.data as Office[];
        },
    });

    const officeIdParam = searchParams.get("officeId");

    // Sync State with URL or Default
    useEffect(() => {
        if (offices.length > 0) {
            if (officeIdParam) {
                const office = offices.find(o => o.id === officeIdParam);
                if (office && office.id !== currentOffice?.id) {
                    setCurrentOfficeState(office);
                }
            } else {
                // No param, default to first
                const defaultOffice = offices[0];
                setCurrentOfficeState(defaultOffice);
                setSearchParams(prev => {
                    prev.set("officeId", defaultOffice.id);
                    return prev;
                }, { replace: true });
            }
        }
    }, [offices, officeIdParam, setSearchParams, currentOffice?.id]);

    const setCurrentOffice = (office: Office | null) => {
        setCurrentOfficeState(office);
        if (office) {
            setSearchParams(prev => {
                prev.set("officeId", office.id);
                return prev;
            });
        } else {
            setSearchParams(prev => {
                prev.delete("officeId");
                return prev;
            });
        }
    };

    return (
        <OfficeContext.Provider value={{ 
            currentOffice, 
            currentOfficeId: currentOffice?.id, 
            setCurrentOffice, 
            offices, 
            isLoading 
        }}>
            {children}
        </OfficeContext.Provider>
    );
};

export const useOffice = () => {
    const context = useContext(OfficeContext);
    if (!context) {
        throw new Error("useOffice must be used within an OfficeProvider");
    }
    return context;
};

export const useOptionalOffice = () => {
    return useContext(OfficeContext);
};
