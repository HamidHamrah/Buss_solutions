FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/bus-solution-api.csproj ./backend/
RUN dotnet restore backend/bus-solution-api.csproj

COPY backend/. ./backend/
RUN dotnet publish backend/bus-solution-api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish ./
COPY customers ./customers
ENTRYPOINT ["dotnet", "bus-solution-api.dll"]
