import React from 'react';

// Props: first, second, third are strings (emails for now)
export default function Podium({ first, second, third }) {
	return (
		<div className="w-full flex items-end justify-center gap-4 mt-6">
			{/* Second place */}
			<div className="flex flex-col items-center">
				<div className="text-sm text-gray-600 mb-1">2nd</div>
				<div className="bg-gray-200 w-20 h-24 rounded-t-xl flex items-center justify-center">
					<span className="text-xs text-gray-800 px-2 text-center break-words">{second}</span>
				</div>
			</div>

			{/* First place */}
			<div className="flex flex-col items-center">
				<div className="text-sm text-yellow-600 font-semibold mb-1">1st</div>
				<div className="bg-yellow-300 w-24 h-32 rounded-t-xl shadow-lg flex items-center justify-center">
					<span className="text-sm text-gray-900 px-2 text-center break-words font-medium">{first}</span>
				</div>
			</div>

			{/* Third place */}
			<div className="flex flex-col items-center">
				<div className="text-sm text-orange-600 mb-1">3rd</div>
				<div className="bg-orange-200 w-20 h-20 rounded-t-xl flex items-center justify-center">
					<span className="text-xs text-gray-800 px-2 text-center break-words">{third}</span>
				</div>
			</div>
		</div>
	);
}
