import Image from "next/image";

interface ModalHeaderProps {
    onClose: () => void;
    title?: string;
}

export default function ModalHeader({ onClose, title = "Zenith Eclipse Call" }: ModalHeaderProps) {
    return (
        <div className="modal-header">
            <div className="modal-title-container">
                <Image 
                    src="/images/Zenith-Eclipse-Logo.webp" 
                    alt="Zenith Eclipse Logo" 
                    width={30} 
                    height={30}
                    className="modal-logo"
                    onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    }}
                />
                <p className="modal-title">{title}</p>
            </div>
            <button 
                className="close-button" 
                onClick={onClose}
                aria-label="Close chat"
            >
            &times;
            </button>
        </div>
    )
}