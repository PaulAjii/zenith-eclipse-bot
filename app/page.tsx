'use client';

import { useState } from 'react';
import Image from 'next/image';
import ChatModal from './components/ChatModal';
// import NotificationModal from './components/NotificationModal';
import VoiceChat from './components/VoiceChat';

export default function HomePage() {
	const [showChatModal, setShowChatModal] = useState(false);
	const [showCallModal, setShowCallModal] = useState(false);
	// const [showNotification, setShowNotification] = useState(false);
	
	const handleChatClick = () => {
		setShowChatModal(true);
	};
	
	const handleCloseChat = () => {
		setShowChatModal(false);
	};
	
	const handleCallModal = () => {
		setShowCallModal(true);
	};
	
	const handleCloseCallModal = () => {
		setShowCallModal(false);
	};

	return (
		<div className="home-page">
			<header className="site-header">
				<div className="logo-container">
					<Image 
						src="/logo.svg" 
						alt="Zenith Eclipse Logo" 
						className="logo-image"
						width={70}
						height={70}
						priority
					/>
					<div className="logo-text">
						<div className="logo-name">ZENITH ECLIPSE</div>
						<div className="logo-co">CO</div>
					</div>
				</div>
			</header>
			
			<main className="home-content">
				<div className="welcome-container">
					<h1 className="welcome-title">WELCOME TO<br />ZENITH ECLIPSE CO!</h1>
					<p className="welcome-text">
						We&apos;re delighted to assist you. You can chat with us live or make a free call 
						directly from your browser—available 24/7 for your convenience. 
						Feel free to choose the easiest way to connect, and we&apos;re here to help anytime!
					</p>
				</div>
				
				<div className="contact-options">
					<button 
						className="call-button" 
						onClick={handleCallModal}
					>
						<svg className="phone-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" 
								stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
						CALL US
					</button>
					<button 
						className="chat-button" 
						onClick={handleChatClick}
					>
						<svg className="chat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" 
								stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
						</svg>
						CHAT
					</button>
				</div>
			</main>
			
			{showChatModal && (
				<ChatModal onClose={handleCloseChat} />
			)}
			
			{/* {showNotification && (
				<NotificationModal 
					title="Coming Soon" 
					message="Our call center functionality will be available soon. Please use our chat feature in the meantime."
					onClose={handleCloseNotification}
				/>
			)} */}
			{
				showCallModal && (
					<VoiceChat onClose={handleCloseCallModal} />
				)
			}
		</div>
	);
}
