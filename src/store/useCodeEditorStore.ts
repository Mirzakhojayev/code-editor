import {create} from 'zustand';
import { LANGUAGE_CONFIG } from '@/app/(root)/_constants';
import { CodeEditorState } from '@/types';
import { Monaco } from '@monaco-editor/react';

const getInitialState = () => {


    if (typeof window !== undefined) {
        return {
            language:"javascript",
            fontSize:16,
            theme:"vs-dark"
        };
    }

    const savedLanguage = localStorage.getItem("editor-language") || "javascript";
    const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
    const savedFontSize = localStorage.getItem("editor-font-size") || 16;

    return {
        language:savedLanguage,
        fontSize:Number(savedFontSize),
        theme:savedTheme
    }
}

export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
    const initialState = getInitialState();
    
    return {
        ...initialState,
        output: "",
        isRunning: false,
        error: null,
        editor: null,
        executionsResult: null,

        getCode: () => {
            const state = get();
            return state.editor?.getValue() || '';
        },

        setEditor: (editor:Monaco) => {
            const savedCode = localStorage.getItem(`editor-code-${get().language}`)
            
            if (savedCode) {
                editor.setValue(savedCode);
            }

            set({ editor });
        },
        
        setTheme: (theme: string) => {
            localStorage.setItem("editor-theme", theme);
            set({theme});
        },

        setFontSize: (fontSize: number) => {
            localStorage.setItem("editor-font-size", fontSize.toString());
            set({ fontSize });
        },

        setLanguage: (language: string) => {
            const currentLanguage = get().editor?.getValue();

            if (currentLanguage) {
                localStorage.setItem(`editor-code-${get().language}`, currentLanguage);
            }

            localStorage.setItem("editor-language", language);

            set({
                language,
                output: "",
                error: null,
            });
        },


    }
})