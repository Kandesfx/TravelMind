import pandas as pd
import numpy as np

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans raw booking DataFrame:
    1. Drop 'company' column.
    2. Fill NaNs: agent=0, children=0, country=mode.
    3. Filter outliers: adr >= 0, cap adr at 1000, adults+children+babies > 0, weekend_nights+week_nights > 0.
    4. Normalize 'meal': 'Undefined' -> 'SC'.
    5. Drop redundant columns.
    """
    df = df.copy()
    
    # 1. Drop company column (94% missing)
    if 'company' in df.columns:
        df.drop(columns=['company'], inplace=True)
        
    # 2. Fill missing values
    if 'agent' in df.columns:
        df['agent'] = df['agent'].fillna(0).astype(int)
    if 'children' in df.columns:
        df['children'] = df['children'].fillna(0).astype(int)
    if 'babies' in df.columns:
        df['babies'] = df['babies'].fillna(0).astype(int)
    if 'country' in df.columns:
        most_common_country = df['country'].mode()[0] if not df['country'].mode().empty else 'PRT'
        df['country'] = df['country'].fillna(most_common_country)
        
    # 3. Filter outliers
    if 'adr' in df.columns:
        df = df[df['adr'] >= 0]
        # Cap high adr at 1000
        df.loc[df['adr'] > 1000, 'adr'] = 1000.0
        
    if 'adults' in df.columns and 'children' in df.columns and 'babies' in df.columns:
        df = df[(df['adults'] > 0) | (df['children'] > 0) | (df['babies'] > 0)]
        
    if 'stays_in_weekend_nights' in df.columns and 'stays_in_week_nights' in df.columns:
        df = df[(df['stays_in_weekend_nights'] > 0) | (df['stays_in_week_nights'] > 0)]
        
    # 4. Normalize 'meal'
    if 'meal' in df.columns:
        df['meal'] = df['meal'].replace('Undefined', 'SC')
        
    return df

def create_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Performs Feature Engineering to discretize the 15 features 
    required for Association Rule mining.
    """
    df = df.copy()
    
    trans_df = pd.DataFrame()
    
    # 1. Hotel_Type
    if 'hotel' in df.columns:
        trans_df['Hotel_Type'] = df['hotel'].map({
            'Resort Hotel': 'Hotel_Resort',
            'City Hotel': 'Hotel_City'
        }).fillna('Hotel_City')
    elif 'hotel_type' in df.columns:
        trans_df['Hotel_Type'] = df['hotel_type'].map({
            'Resort Hotel': 'Hotel_Resort',
            'City Hotel': 'Hotel_City'
        }).fillna('Hotel_City')
        
    # 2. Meal_Type
    if 'meal' in df.columns:
        trans_df['Meal_Type'] = df['meal'].map({
            'BB': 'Meal_BB',
            'HB': 'Meal_HB',
            'FB': 'Meal_FB',
            'SC': 'Meal_SC'
        }).fillna('Meal_BB')
        
    # 3. Room_Type
    if 'reserved_room_type' in df.columns:
        trans_df['Room_Type'] = 'Room_' + df['reserved_room_type'].str.strip()
    elif 'room_type' in df.columns:
        trans_df['Room_Type'] = 'Room_' + df['room_type'].str.strip()
        
    # 4. Customer_Type
    if 'customer_type' in df.columns:
        trans_df['Customer_Type'] = df['customer_type'].map({
            'Transient': 'Cust_Transient',
            'Contract': 'Cust_Contract',
            'Transient-Party': 'Cust_TransientParty',
            'Group': 'Cust_Group'
        }).fillna('Cust_Transient')
        
    # 5. Channel (Market Segment mapping)
    if 'market_segment' in df.columns:
        trans_df['Channel'] = df['market_segment'].map({
            'Online TA': 'Ch_OnlineTA',
            'Offline TA/TO': 'Ch_OfflineTA',
            'Direct': 'Ch_Direct',
            'Corporate': 'Ch_Corporate',
            'Groups': 'Ch_Groups',
            'Complementary': 'Ch_Direct',
            'Aviation': 'Ch_Corporate'
        }).fillna('Ch_OnlineTA')
        
    # 6. Deposit
    if 'deposit_type' in df.columns:
        trans_df['Deposit'] = df['deposit_type'].map({
            'No Deposit': 'Dep_NoDeposit',
            'Non Refund': 'Dep_NonRefund',
            'Refundable': 'Dep_Refundable'
        }).fillna('Dep_NoDeposit')
        
    # 7. Group_Size
    if 'adults' in df.columns:
        def get_group_size(row):
            tot_children = int(row.get('children', 0)) + int(row.get('babies', 0))
            adults = int(row.get('adults', 2))
            if tot_children > 0:
                return 'Group_Family'
            elif adults == 1:
                return 'Group_Solo'
            elif adults == 2:
                return 'Group_Couple'
            else:
                return 'Group_Large'
        trans_df['Group_Size'] = df.apply(get_group_size, axis=1)
        
    # 8. Season
    if 'arrival_date_month' in df.columns:
        trans_df['Season'] = df['arrival_date_month'].map({
            'March': 'Season_Spring', 'April': 'Season_Spring', 'May': 'Season_Spring',
            'June': 'Season_Summer', 'July': 'Season_Summer', 'August': 'Season_Summer',
            'September': 'Season_Autumn', 'October': 'Season_Autumn', 'November': 'Season_Autumn',
            'December': 'Season_Winter', 'January': 'Season_Winter', 'February': 'Season_Winter'
        }).fillna('Season_Summer')
    elif 'check_in' in df.columns:
        # If it's a date object
        def get_season_from_date(dt):
            if pd.isna(dt): return 'Season_Summer'
            # Convert if string
            if isinstance(dt, str):
                try: dt = pd.to_datetime(dt)
                except: return 'Season_Summer'
            month = dt.month
            if month in [3, 4, 5]: return 'Season_Spring'
            elif month in [6, 7, 8]: return 'Season_Summer'
            elif month in [9, 10, 11]: return 'Season_Autumn'
            else: return 'Season_Winter'
        # Parse if object
        checkin_dates = pd.to_datetime(df['check_in'], errors='coerce')
        trans_df['Season'] = checkin_dates.apply(get_season_from_date)
        
    # 9. Price_Range (Budget, Mid, Premium based on ADR)
    if 'adr' in df.columns:
        def get_price_range(adr):
            if adr < 50: return 'Price_Budget'
            elif adr <= 150: return 'Price_Mid'
            else: return 'Price_Premium'
        trans_df['Price_Range'] = df['adr'].apply(get_price_range)
        
    # 10. Lead_Time (LastMinute, Short, Medium, Long)
    if 'lead_time' in df.columns:
        def get_lead_time_cat(days):
            if days < 7: return 'Lead_LastMinute'
            elif days <= 30: return 'Lead_Short'
            elif days <= 90: return 'Lead_Medium'
            else: return 'Lead_Long'
        trans_df['Lead_Time'] = df['lead_time'].apply(get_lead_time_cat)
        
    # 11. Weekend_Stay (None, Short, Long)
    if 'stays_in_weekend_nights' in df.columns:
        def get_weekend_cat(nights):
            if nights == 0: return 'Weekend_None'
            elif nights <= 2: return 'Weekend_Short'
            else: return 'Weekend_Long'
        trans_df['Weekend_Stay'] = df['stays_in_weekend_nights'].apply(get_weekend_cat)
        
    # 12. Weekday_Stay (Short, Medium, Long)
    if 'stays_in_week_nights' in df.columns:
        def get_weekday_cat(nights):
            if nights <= 2: return 'Weekday_Short'
            elif nights <= 5: return 'Weekday_Medium'
            else: return 'Weekday_Long'
        trans_df['Weekday_Stay'] = df['stays_in_week_nights'].apply(get_weekday_cat)
        
    # 13. Special_Requests (None, Few, Many)
    if 'total_of_special_requests' in df.columns:
        def get_spec_req_cat(requests):
            if requests == 0: return 'SpecReq_None'
            elif requests <= 2: return 'SpecReq_Few'
            else: return 'SpecReq_Many'
        trans_df['Special_Requests'] = df['total_of_special_requests'].apply(get_spec_req_cat)
        
    # 14. Parking (Parking_Yes, Parking_No)
    if 'required_car_parking_spaces' in df.columns:
        trans_df['Parking'] = df['required_car_parking_spaces'].apply(
            lambda x: 'Parking_Yes' if x > 0 else 'Parking_No'
        )
        
    # 15. Repeat_Guest (Repeat_Yes, Repeat_No)
    if 'is_repeated_guest' in df.columns:
        trans_df['Repeat_Guest'] = df['is_repeated_guest'].map({
            1: 'Repeat_Yes',
            0: 'Repeat_No'
        }).fillna('Repeat_No')
        
    return trans_df
