Operation Instructions

Open the terminal window and make sure you are in the project folder root directory.
Step 2: Type npm start to run the application and open it

Step 3. Press one of the menu options (1-5) for the function you want.

Step 4: Enter 1 into the terminal and hit Enter to make a new reservation.

Step 4a: Enter the main Tramper name, a targeted Hut ID (such as hut-01 through hut-04), your arrival date (YYYY-MM-DD), the number of nights you plan to stay, and the number of people in your party.

Step 4b: The system will evaluate your inputs. If any single night of your stay overflows the target hut's maximum allocation threshold, the booking will be immediately rejected.

Step 4c: The booking will be successfully saved to the disk database if capacity allows, and the terminal will print a unique reference code (such as bk-1719321354000).

Step 5: Enter 2 into the terminal to display the current Bookings & Free Capacity.

Step 5a: Enter the precise query calendar date you want to examine, then the Hut ID of the hut you want to check.

Step 5b: The system will provide the current evening roster for that date, including the trampers' names, group sizes, booking reference IDs, total number of occupied bunks, and the number of available free bunks.

Step 6: Enter 3 into the terminal to cancel an active reservation.

Step 6a: Type in the unique booking identifier number that you want to remove.

Step 6b: The code will be looked for by the system. If a match is discovered, the held capacity for those particular days will be released and the registry record will be immediately removed from the local storage file.

Step 7: Enter 4 into the terminal to see the summary report for every hut in the list.

Step 7a: The system will produce an overview of occupancy data for each of the four tracks, showing the total number of unique group ledger registries and the total number of unit bed-nights allotted to each hut.

Step 8: Enter 5 into the terminal to end the system. The application will safely return to your regular terminal environment after the interface stream closes.