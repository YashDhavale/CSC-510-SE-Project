import React from 'react';

// Props: first, second, third are strings (emails for now)
export default function Podium({ medalists }) {
	return (
		<div className="w-full flex items-end justify-center gap-4 mt-6">
			{/* Second place */}
			<div className="flex flex-col items-center">
				<div className="text-sm text-gray-600 mb-1">2nd</div>
				<div className="bg-gray-200 w-20 h-24 rounded-t-xl flex flex-col items-center justify-center">
					<span className="text-xs text-gray-800 px-2 text-center break-words">{medalists[1].name}</span>
                    <span className="text-xs text-gray-800 px-2 text-center break-words">{medalists[1].value}</span>
				</div>
			</div>

			{/* First place */}
			<div className="flex flex-col items-center">
				<div className="text-sm text-yellow-600 font-semibold mb-1">1st</div>
				<div className="bg-yellow-300 w-24 h-32 rounded-t-xl shadow-lg flex flex-col items-center justify-center">
					<span className="text-sm text-gray-900 px-2 text-center break-words font-medium">{medalists[0].name}</span>
                    <span className="text-sm text-gray-900 px-2 text-center break-words font-medium">{medalists[0].value}</span>
                    
				</div>
			</div>

			{/* Third place */}
			<div className="flex flex-col items-center">
				<div className="text-sm text-orange-600 mb-1">3rd</div>
				<div className="bg-orange-200 w-20 h-20 rounded-t-xl flex flex-col items-center justify-center">
					<span className="text-xs text-gray-800 px-2 text-center break-words">{medalists[2].name}</span>
                    <span className="text-xs text-gray-800 px-2 text-center break-words">{medalists[2].value}</span>
				</div>
			</div>
		</div>
	);
}
