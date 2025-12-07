import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const ScrollView = forwardRef(({
    children,
    className = '',
    shadowColor = 'rgba(0, 0, 0, 0.3)',
    shadowSize = 12,
    onScroll,
    ...props
}, ref) => {
    const scrollRef = useRef(null);

    // Expose the scroll element ref to parent components
    useImperativeHandle(ref, () => scrollRef.current);
    const [shadows, setShadows] = useState({
        top: false,
        bottom: false,
        left: false,
        right: false
    });

    const updateShadows = () => {
        const el = scrollRef.current;
        if (!el) return;

        const hasVerticalScroll = el.scrollHeight > el.clientHeight;
        const hasHorizontalScroll = el.scrollWidth > el.clientWidth;

        setShadows({
            top: hasVerticalScroll && el.scrollTop > 0,
            bottom: hasVerticalScroll && el.scrollTop < el.scrollHeight - el.clientHeight,
            left: hasHorizontalScroll && el.scrollLeft > 0,
            right: hasHorizontalScroll && el.scrollLeft < el.scrollWidth - el.clientWidth
        });
    };

    const handleScroll = (e) => {
        updateShadows();
        if (onScroll) onScroll(e);
    };

    useEffect(() => {
        updateShadows();

        const el = scrollRef.current;
        if (!el) return;

        const resizeObserver = new ResizeObserver(updateShadows);
        resizeObserver.observe(el);

        return () => {
            resizeObserver.disconnect();
        };
    }, [children]);

    return (
        <div className={`relative min-h-0 ${className}`} {...props}>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full w-full overflow-auto scrollbar-hide"
            >
                {children}
            </div>

            {shadows.top && (
                <div
                    className="absolute top-0 left-0 right-0 pointer-events-none"
                    style={{
                        height: `${shadowSize}px`,
                        background: `linear-gradient(to bottom, ${shadowColor}, transparent)`
                    }}
                />
            )}

            {shadows.bottom && (
                <div
                    className="absolute bottom-0 left-0 right-0 pointer-events-none"
                    style={{
                        height: `${shadowSize}px`,
                        background: `linear-gradient(to top, ${shadowColor}, transparent)`
                    }}
                />
            )}

            {shadows.left && (
                <div
                    className="absolute top-0 left-0 bottom-0 pointer-events-none"
                    style={{
                        width: `${shadowSize}px`,
                        background: `linear-gradient(to right, ${shadowColor}, transparent)`
                    }}
                />
            )}

            {shadows.right && (
                <div
                    className="absolute top-0 right-0 bottom-0 pointer-events-none"
                    style={{
                        width: `${shadowSize}px`,
                        background: `linear-gradient(to left, ${shadowColor}, transparent)`
                    }}
                />
            )}
        </div>
    );
});

ScrollView.displayName = 'ScrollView';

export default ScrollView;
