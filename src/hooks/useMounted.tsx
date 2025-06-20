'use client'

import { useEffect, useState } from 'react';

const useMounted = () => {
    
    const [mounted, useMounted] = useState(false);

    useEffect(() => {
        useState(true);
    }, []);

    return mounted;
}

export default useMounted;