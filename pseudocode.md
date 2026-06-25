================================================================================
DOC GREAT WALKS HUT BOOKING MANAGER - SYSTEM LOGIC PSEUDOCODE
================================================================================

--------------------------------------------------------------------------------
1. GLOBAL SYSTEM SETUP & DATA STORAGE
--------------------------------------------------------------------------------
DEFINE CONSTANT HUTS = [
    { id: "hut-01", name: "Mintaro Hut",         capacity: 40 },
    { id: "hut-02", name: "Clinton Hut",         capacity: 40 },
    { id: "hut-03", name: "Luxmore Hut",         capacity: 50 },
    { id: "hut-04", name: "Routeburn Falls Hut", capacity: 48 }
]

DEFINE GLOBAL VARIABLE BookingsList = []

FUNCTION INITIALIZE_SYSTEM()
    TRY
        IF local_database_file_exists THEN
            READ local_database_file
            SET BookingsList = parsed_json_data
        ELSE
            CREATE local_database_directory
            CREATE local_database_file with empty array "[]"
            SET BookingsList = empty_list
        END IF
    CATCH_ERROR
        PRINT "Warning: Database corrupted. Starting with an empty system."
        SET BookingsList = empty_list
    END TRY
END FUNCTION

--------------------------------------------------------------------------------
2. INPUT GATEKEEPERS (VALIDATION ENGINES)
--------------------------------------------------------------------------------

FUNCTION VALIDATE_USER_NAME(input_name)
    IF input_name IS EMPTY OR input_name CONTAINS ONLY SPACES THEN
        RETURN "Error: Tramper name cannot be blank."
    END IF
    RETURN VALID_NULL
END FUNCTION

FUNCTION VALIDATE_USER_INTEGER(input_value)
    IF input_value IS NOT A WHOLE NUMBER OR input_value IS LESS THAN OR EQUAL TO 0 THEN
        RETURN "Error: Input must be a positive whole integer."
    END IF
    RETURN VALID_NULL
END FUNCTION

FUNCTION VALIDATE_USER_DATE(input_date_string)
    IF input_date_string DOES NOT MATCH PATTERN "YYYY-MM-DD" THEN
        RETURN "Error: Date format must be YYYY-MM-DD."
    END IF

    IF input_date_string IS NOT A REAL CALENDAR DAY (e.g., February 30th) THEN
        RETURN "Error: This date does not exist on the calendar."
    END IF

    IF input_date_string IS A DAY BEFORE TODAY'S DATE THEN
        RETURN "Error: Booking dates cannot reside in the past."
    END IF

    RETURN VALID_NULL
END FUNCTION

--------------------------------------------------------------------------------
3. THE HEART: MULTI-NIGHT CAPACITY CALCULATION ENGINE
--------------------------------------------------------------------------------

FUNCTION EXPLODE_STAY_INTO_DATES(arrival_date, total_nights)
    DEFINE dates_list = []
    FOR i FROM 0 TO (total_nights - 1)

        DEFINE next_date = arrival_date + i DAYS
        ADD next_date TO dates_list
    END FOR
    RETURN dates_list
END FUNCTION

FUNCTION RUN_CAPACITY_AUDIT(target_hut_id, arrival_date, nights, new_party_size)
    DEFINE target_hut = FIND hut IN HUTS WHERE hut.id EQUALS target_hut_id
    DEFINE requested_nights_list = EXPLODE_STAY_INTO_DATES(arrival_date, nights)

    FOR EACH individual_night IN requested_nights_list
        DEFINE current_night_occupancy = 0

        FOR EACH active_booking IN BookingsList
            IF active_booking.hutId EQUALS target_hut_id THEN
                DEFINE active_booking_nights = EXPLODE_STAY_INTO_DATES(active_booking.arrivalDate, active_booking.nights)

                IF active_booking_nights CONTAINS individual_night THEN
                    current_night_occupancy = current_night_occupancy + active_booking.partySize
                END IF
            END IF
        END FOR

        IF (current_night_occupancy + new_party_size) > target_hut.capacity THEN
            RETURN {
                allowed: FALSE,
                failed_date: individual_night,
                available_bunks: (target_hut.capacity - current_night_occupancy)
            }
        END IF
    END FOR

    RETURN { allowed: TRUE }
END FUNCTION

--------------------------------------------------------------------------------
4. MENU INTERFACE CONTROLLER FLUID WORKFLOWS
--------------------------------------------------------------------------------

FUNCTION APPLICATION_CORE_LOOP()
    CALL INITIALIZE_SYSTEM()

    LOOP UNTIL USER_EXITS
        PRINT_MENU_OPTIONS()
        READ user_choice

        IF user_choice EQUALS "1" THEN
            CALL WORKFLOW_RECORD_NEW_BOOKING()
        ELSE IF user_choice EQUALS "2" THEN
            CALL WORKFLOW_VIEW_NIGHTLY_OCCUPANCY()
        ELSE IF user_choice EQUALS "3" THEN
            CALL WORKFLOW_CANCEL_EXISTING_BOOKING()
        ELSE IF user_choice EQUALS "4" THEN
            CALL WORKFLOW_VIEW_AGGREGATE_REPORT()
        ELSE IF user_choice EQUALS "5" THEN
            PRINT "Exiting system. Goodbye."
            SHUTDOWN_APPLICATION()
        ELSE
            PRINT "Invalid option. Please choose a number between 1 and 5."
        END IF
    END LOOP
END FUNCTION

--------------------------------------------------------------------------------
5. INDIVIDUAL WORKFLOW LOGIC
--------------------------------------------------------------------------------

FUNCTION WORKFLOW_RECORD_NEW_BOOKING()

    READ tramper_name
    IF VALIDATE_USER_NAME(tramper_name) HAS ERROR THEN RETURN

    DISPLAY_AVAILABLE_HUTS()
    READ chosen_hut_id
    IF chosen_hut_id NOT IN HUTS THEN RETURN

    READ arrival_date
    IF VALIDATE_USER_DATE(arrival_date) HAS ERROR THEN RETURN

    READ total_nights
    IF VALIDATE_USER_INTEGER(total_nights) HAS ERROR THEN RETURN

    READ party_size
    IF VALIDATE_USER_INTEGER(party_size) HAS ERROR THEN RETURN

    DEFINE audit_result = RUN_CAPACITY_AUDIT(chosen_hut_id, arrival_date, total_nights, party_size)

    IF audit_result.allowed EQUALS FALSE THEN
        PRINT "[REJECTED]: Cannot book. Hut overflows on: " + audit_result.failed_date
        PRINT "Bunks remaining on that night: " + audit_result.available_bunks
    ELSE

        DEFINE unique_id = "bk-" + GET_CURRENT_TIMESTAMP()
        DEFINE new_booking = {
            id: unique_id,
            tramperName: tramper_name,
            hutId: chosen_hut_id,
            arrivalDate: arrival_date,
            nights: total_nights,
            partySize: party_size
        }

        ADD new_booking TO BookingsList
        SAVE_BOOKINGS_LIST_TO_DISK_FILE()
        PRINT "[SUCCESS]: Reference code generated: " + unique_id
    END IF
END FUNCTION

FUNCTION WORKFLOW_VIEW_NIGHTLY_OCCUPANCY()
    READ target_hut_id
    READ query_date

    DEFINE occupied_count = 0
    PRINT "Roster for " + query_date + ":"

    FOR EACH booking IN BookingsList
        IF booking.hutId EQUALS target_hut_id THEN
            DEFINE stay_