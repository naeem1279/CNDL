"use client";

interface ButtonProp{
    children: React.ReactNode;
    color?: string;
    onClick?: () => void;
}

function Button({children, color, onClick}: ButtonProp) {
    return (
        <div className={`p-1 border-[0.5px] text-[10px] md:text-xs lg:text-base flex items-center gap-1.5 cursor-pointer ${color}`} onClick={onClick}>
            {children}
        </div>
    );
}

export default Button;